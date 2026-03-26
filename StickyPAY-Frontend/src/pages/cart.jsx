import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { ShoppingCart, Trash2, Plus, Minus, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCart, clearCart, saveCart, saveOrder, getTokens, redeemTokens as redeemTokensFn, awardTokens, getUser } from '../components/localData';
import QRReceipt from '../components/QRReceipt';
import PaymentSheet from '../components/PaymentSheet';
import { StoreContext } from "@/lib/StoreContext";

export default function Cart() {
  const navigate = useNavigate();
  const { activeStore, clearStore } = useContext(StoreContext);
  const [cartData, setCartData] = useState(null);
  const [items, setItems] = useState([]);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [showReceipt, setShowReceipt] = useState(false);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const [redeemCoins, setRedeemCoins] = useState(false);
  const [userTokens, setUserTokens] = useState({ total: 0 });
  const user = getUser();

  const COUPONS = [
    { code: 'SAVE10', desc: '10% off above ₹500', type: 'percent', value: 10, min: 500 },
    { code: 'NEWUSER', desc: 'Flat ₹50 off above ₹200', type: 'flat', value: 50, min: 200 },
    { code: 'UPI5', desc: '5% cashback on UPI', type: 'percent', value: 5, min: 100 },
    { code: 'WEEKEND20', desc: '20% off above ₹300', type: 'percent', value: 20, min: 300 },
  ];

  useEffect(() => {
    const data = getCart();
    if (data && data.items && data.items.length > 0) {
      setCartData(data);
      setItems(data.items);
    }
  }, []);

  const updateItems = (updated) => {
    setItems(updated);
    if (cartData) {
      const total = updated.reduce((s, i) => s + i.price * i.quantity, 0);
      saveCart({ ...cartData, items: updated, total });
    }
  };

  const syncCartWithDB = (productId, newQty, action) => {
    if (!user?.id || !activeStore?.store_id) {
      console.warn("⚠️ Missing user_id or store_id", { user, activeStore });
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        product_id: productId,
        store_id: activeStore.store_id,
        quantity: newQty,
        action
      })
    }).catch(() => {});
  };

  const updateQuantity = (itemId, delta) => {
    updateItems(
      items.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty > 0) syncCartWithDB(item.id, newQty, 'update');
          else syncCartWithDB(item.id, 0, 'remove');
          return newQty === 0 ? null : { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeItem = (itemId) => {
    syncCartWithDB(itemId, 0, 'remove');
    updateItems(items.filter(item => item.id !== itemId));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyDiscount = (amt) => {
    if (!appliedCoupon) return amt;
    if (appliedCoupon.type === 'flat') return Math.max(0, amt - appliedCoupon.value);
    return Math.max(0, amt - (amt * appliedCoupon.value) / 100);
  };

  const coinDiscount = redeemCoins ? Math.min(userTokens.total, totalAmount * 0.5) : 0;

  const applyCoupon = (code) => {
    const c = COUPONS.find(c => c.code === (code || couponInput).toUpperCase());
    if (!c) { setCouponError('Invalid coupon code'); return; }
    if (totalAmount < c.min) { setCouponError(`Min. order ₹${c.min} required`); return; }
    setAppliedCoupon(c);
    setCouponInput(c.code);
    setCouponError('');
    setShowCoupons(false);
  };

  const handlePayment = async (method) => {
    if (processing) return;

    console.log("🔥 PAYMENT CLICKED:", method);

    const finalPaymentMethod = method; // ✅ FIX (no state issue)

    setProcessing(true);

    if (redeemCoins && coinDiscount > 0) redeemTokensFn(coinDiscount);
    const finalAmount = Math.max(0, applyDiscount(totalAmount) - coinDiscount);

    try {
      if (user?.id) {
        const storeId = activeStore?.store_id;
        const freshCart = getCart();
        const updatedItems = freshCart?.items || [];

        if (!updatedItems || updatedItems.length === 0) {
          alert("Cart is empty!");
          setProcessing(false);
          return;
        }

        console.log("🚀 SENDING TO BACKEND:", {
          user_id: user.id,
          store_id: storeId,
          payment_method: finalPaymentMethod,
          items: updatedItems
        });

        // ✅ CHECKOUT API
        const checkoutRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            store_id: storeId,
            payment_method: finalPaymentMethod, // ✅ FIX
            store_name: activeStore?.name || 'Store',
            items: updatedItems.map(item => ({
              product_id: item.product_id || item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          })
        });

        if (!checkoutRes.ok) {
          const errData = await checkoutRes.json();
          console.log("🔥 BACKEND ERROR:", errData);
          alert(errData.detail || errData.error || "Checkout failed");
          setProcessing(false);
          return;
        }

        const checkoutData = await checkoutRes.json();
        const backendOrder = checkoutData.order;

        // ✅ CONFIRM PAYMENT
        await fetch(`${import.meta.env.VITE_API_URL}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: backendOrder.order_id,
            user_id: user.id,
            store_id: storeId,
            items,
            amount: finalAmount,
            payment_method: finalPaymentMethod // ✅ FIX
          })
        });

        // ✅ DISPLAY ORDER
        const displayOrder = {
          ...backendOrder,
          created_at: backendOrder.created_at || new Date().toISOString(),
          store_name: activeStore?.name || backendOrder.store_name || 'Store',
          payment_method: finalPaymentMethod, // ✅ FIX
          items: updatedItems.map(item => ({
            product_id: item.product_id || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        };

        // Save locally
        const localCached = JSON.parse(localStorage.getItem('sp_orders') || '[]');
        localCached.unshift({
          ...displayOrder,
          id: displayOrder.order_id,
          qr_code_data: backendOrder.transaction_id,
          status: 'paid',
          created_date: new Date().toISOString()
        });
        localStorage.setItem('sp_orders', JSON.stringify(localCached));

        clearCart();
        clearStore();
        setItems([]);

        awardTokens(backendOrder.order_id, finalAmount);

        setOrder(displayOrder);
        setShowReceipt(true);
        setShowPaymentSheet(false);
        setProcessing(false);
        return;
      }
    } catch (err) {
      console.error("❌ Order API failed", err);
      alert('Unable to connect to server. Please try again.');
      setProcessing(false);
      return;
    }

    // Offline fallback
    const newOrder = saveOrder({
      store_id: activeStore?.store_id || 'unknown',
      store_name: activeStore?.name || 'Store',
      items: items.map(item => ({
        product_id: item.product_id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total_amount: finalAmount,
      payment_method: finalPaymentMethod, // ✅ FIX
    });

    clearCart();
    clearStore();
    setItems([]);

    awardTokens(newOrder.id, finalAmount);

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
          <Button onClick={() => navigate(createPageUrl('Scanner'))} className="bg-yellow-400 text-black font-semibold px-8 py-3 rounded-xl">
            Go to Scanner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Cart</h1>
        <p className="text-gray-400 mt-0.5 text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''} · {activeStore?.name || 'No Store'}</p>
      </div>

      {/* Items */}
      <div className="px-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-[#0f1117] rounded-2xl p-4 border border-gray-800/70">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white">{item.name}</h3>
                {(item.brand || item.weight || item.category) && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    {[item.brand, item.weight, item.category].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-yellow-400 font-semibold text-sm mt-1">₹{item.price.toFixed(2)} each</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {item.barcode && <p className="text-gray-600 text-xs font-mono">🔖 {item.barcode}</p>}
                  {item.mfg_date && <p className="text-gray-500 text-xs">MFG: {item.mfg_date}</p>}
                  {item.exp_date && <p className="text-gray-500 text-xs">EXP: {item.exp_date}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-xl bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
            <div className="text-right mt-2 text-xs text-gray-500 border-t border-gray-800 pt-2">
              Subtotal: <span className="text-white font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Coupon */}
      <div className="px-5 mt-4">
        <button
          onClick={() => setShowCoupons(!showCoupons)}
          className="w-full flex items-center justify-between bg-[#0f1117] border border-gray-800/70 rounded-xl px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">
              {appliedCoupon ? `"${appliedCoupon.code}" applied` : 'Apply Coupon'}
            </span>
          </div>
          {showCoupons ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showCoupons && (
          <div className="bg-[#0f1117] border border-gray-800/70 border-t-0 rounded-b-xl px-4 pb-4">
            <div className="flex gap-2 pt-3 mb-3">
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                placeholder="Enter code"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              />
              <button onClick={() => applyCoupon()} className="bg-yellow-400 text-black font-semibold px-4 rounded-xl text-sm">
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-400 text-xs mb-2">{couponError}</p>}
            <p className="text-gray-500 text-xs mb-2">Available coupons:</p>
            <div className="space-y-2">
              {COUPONS.map(c => (
                <button key={c.code} onClick={() => applyCoupon(c.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left ${appliedCoupon?.code === c.code ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-gray-800'}`}>
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
      <div className="px-5 mt-4">
        <div className="bg-[#0f1117] rounded-2xl border border-gray-800/70 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="text-white">₹{totalAmount.toFixed(2)}</span>
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
          <div className="flex justify-between font-bold border-t border-gray-700 pt-2 text-base">
            <span>Total</span>
            <span className="text-yellow-400">₹{Math.max(0, applyDiscount(totalAmount) - coinDiscount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* StickyCoins */}
      {userTokens.total > 0 && (
        <div className="px-5 mt-3">
          <button
            onClick={() => setRedeemCoins(!redeemCoins)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors ${redeemCoins ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-[#0f1117]'}`}
          >
            <span className="text-2xl">🪙</span>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-yellow-400">{userTokens.total.toFixed(2)} StickyCoins</p>
              <p className="text-gray-400 text-xs">
                Tap to {redeemCoins ? 'remove' : 'redeem'} (save ₹{Math.min(userTokens.total, totalAmount * 0.5).toFixed(2)})
              </p>
            </div>
            {redeemCoins && <span className="text-xs text-green-400 font-semibold">Applied ✓</span>}
          </button>
        </div>
      )}

      {/* Proceed to Pay */}
      <div className="px-5 mt-5 mb-32">
        <Button
          onClick={() => setShowPaymentSheet(true)}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-6 rounded-2xl text-base"
        >
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
