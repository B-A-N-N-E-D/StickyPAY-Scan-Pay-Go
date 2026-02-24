import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { ShoppingCart, Trash2, Plus, Minus, Tag, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCart, clearCart, saveCart, saveOrder, getTokens, redeemTokens as redeemTokensFn, awardTokens } from '../components/localData';
import QRReceipt from '../components/QRReceipt';
import PaymentSheet from '../components/PaymentSheet';

export default function Cart() {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);
  const [userTokens, setUserTokens] = useState({ total: 0 });

  const COUPONS = [
    { code: 'SAVE10', desc: '10% off above ₹500', type: 'percent', value: 10, min: 500 },
    { code: 'NEWUSER', desc: 'Flat ₹50 off above ₹200', type: 'flat', value: 50, min: 200 },
    { code: 'UPI5', desc: '5% cashback on UPI', type: 'percent', value: 5, min: 100 },
    { code: 'WEEKEND20', desc: '20% off above ₹300', type: 'percent', value: 20, min: 300 },
  ];

  useEffect(() => {
    const data = getCart();
    if (data) {
      setCartData(data);
      setItems(data.items || []);
    }
    setUserTokens(getTokens());
  }, []);

  // Keep localStorage in sync when items change
  const updateItems = (updated) => {
    setItems(updated);
    if (cartData) {
      const total = updated.reduce((s, i) => s + i.price * i.quantity, 0);
      saveCart({ ...cartData, items: updated, total });
    }
  };

  const updateQuantity = (itemId, delta) => {
    updateItems(
      items.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return newQty === 0 ? null : { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeItem = (itemId) => {
    updateItems(items.filter(item => item.id !== itemId));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyDiscount = (amt) => {
    if (!appliedCoupon) return amt;
    if (appliedCoupon.type === 'flat') return Math.max(0, amt - appliedCoupon.value);
    return Math.max(0, amt - (amt * appliedCoupon.value) / 100);
  };

  const coinDiscount = redeemCoins ? Math.min(userTokens.total, totalAmount * 0.5) : 0; // max 50% off with coins

  const applyCoupon = (code) => {
    const c = COUPONS.find(c => c.code === (code || couponInput).toUpperCase());
    if (!c) { setCouponError('Invalid coupon code'); return; }
    if (totalAmount < c.min) { setCouponError(`Min. order ₹${c.min} required`); return; }
    setAppliedCoupon(c);
    setCouponInput(c.code);
    setCouponError('');
    setShowCoupons(false);
  };

  const handlePayment = (method) => {
    if (processing) return;
    setProcessing(true);
    if (redeemCoins && coinDiscount > 0) redeemTokensFn(coinDiscount);
    const finalAmount = Math.max(0, applyDiscount(totalAmount) - coinDiscount);
    const newOrder = saveOrder({
      store_id: cartData?.store?.id || 'demo',
      store_name: cartData?.store?.name || 'Demo Store',
      items: items.map(item => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total_amount: finalAmount,
      payment_method: method,
    });
    clearCart();
    localStorage.removeItem('sp_active_store');
    // Award tokens for this order
    const { earned } = awardTokens(newOrder.id, finalAmount);
    newOrder._tokensEarned = earned;
    setOrder(newOrder);
    setShowReceipt(true);
    setShowPaymentSheet(false);
    setProcessing(false);
  };

  if (showReceipt) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center py-12">
        <QRReceipt order={order} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="px-6 pt-6 pb-6">
          <h1 className="text-2xl font-bold">Cart</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-center mb-6 text-sm">Scan products from the Scanner tab to add them here</p>
          <Button onClick={() => navigate(createPageUrl('Scanner'))} className="bg-yellow-400 text-black font-semibold">
            Go to Scanner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Cart</h1>
        <p className="text-gray-400 mt-1 text-sm">{totalItems} items · {cartData?.store?.name}</p>
      </div>

      <div className="px-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                {item.brand && <p className="text-gray-500 text-xs">{item.brand}{item.weight ? ` · ${item.weight}` : ''}{item.category ? ` · ${item.category}` : ''}</p>}
                <p className="text-yellow-400 font-semibold text-sm mt-0.5">₹{item.price.toFixed(2)} each</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {item.barcode && <p className="text-gray-600 text-xs font-mono">🔖 {item.barcode}</p>}
                  {item.mfg_date && <p className="text-gray-500 text-xs">MFG: {item.mfg_date}</p>}
                  {item.exp_date && <p className="text-gray-500 text-xs">EXP: {item.exp_date}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-right mt-2 text-gray-400 text-xs border-t border-gray-800 pt-2">
              Subtotal: <span className="text-white font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Coupons */}
      <div className="px-6 mt-5">
        <button onClick={() => setShowCoupons(!showCoupons)} className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{appliedCoupon ? `"${appliedCoupon.code}" applied` : 'Apply Coupon'}</span>
          </div>
          {showCoupons ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showCoupons && (
          <div className="bg-gray-900 border border-gray-800 border-t-0 rounded-b-xl px-4 pb-4">
            <div className="flex gap-2 pt-3 mb-3">
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                placeholder="Enter code"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              />
              <button onClick={() => applyCoupon()} className="bg-yellow-400 text-black font-semibold px-4 rounded-xl text-sm">Apply</button>
            </div>
            {couponError && <p className="text-red-400 text-xs mb-2">{couponError}</p>}
            <p className="text-gray-500 text-xs mb-2">Available coupons:</p>
            <div className="space-y-2">
              {COUPONS.map(c => (
                <button key={c.code} onClick={() => applyCoupon(c.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left ${appliedCoupon?.code === c.code ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-gray-800'}`}>
                  <div>
                    <span className="font-mono font-bold text-yellow-400 text-xs tracking-widest">{c.code}</span>
                    <p className="text-gray-400 text-xs mt-0.5">{c.desc}</p>
                  </div>
                  {appliedCoupon?.code === c.code && <span className="text-xs text-green-400 font-medium">Applied</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bill Summary */}
      <div className="px-6 mt-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-400">
              <span>Discount ({appliedCoupon.code})</span>
              <span>-₹{(totalAmount - applyDiscount(totalAmount)).toFixed(2)}</span>
            </div>
          )}
          {coinDiscount > 0 && (
            <div className="flex justify-between text-yellow-400">
              <span>🪙 StickyCoins</span>
              <span>-₹{coinDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-gray-700 pt-2">
            <span>Total</span>
            <span className="text-yellow-400">₹{Math.max(0, applyDiscount(totalAmount) - coinDiscount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* StickyCoins */}
      {userTokens.total > 0 && (
        <div className="px-6 mt-3">
          <button onClick={() => setRedeemCoins(!redeemCoins)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${redeemCoins ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-gray-900'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-yellow-400">{userTokens.total.toFixed(2)} StickyCoins</p>
                <p className="text-gray-400 text-xs">Tap to {redeemCoins ? 'remove' : 'redeem'} (save ₹{Math.min(userTokens.total, totalAmount * 0.5).toFixed(2)})</p>
              </div>
            </div>
            {redeemCoins && <span className="text-xs text-green-400 font-semibold">Applied ✓</span>}
          </button>
        </div>
      )}

      {/* Checkout Button */}
      <div className="px-6 mt-4 mb-32">
        <Button onClick={() => setShowPaymentSheet(true)} className="w-full bg-green-500 text-black font-semibold py-6 rounded-xl">
          Proceed to Pay · ₹{Math.max(0, applyDiscount(totalAmount) - coinDiscount).toFixed(2)}
        </Button>
      </div>

      {showPaymentSheet && (
        <PaymentSheet
          totalAmount={applyDiscount(totalAmount)}
          redeemTokens={coinDiscount}
          onPay={handlePayment}
          onClose={() => setShowPaymentSheet(false)}
        />
      )}
    </div>
  );
}