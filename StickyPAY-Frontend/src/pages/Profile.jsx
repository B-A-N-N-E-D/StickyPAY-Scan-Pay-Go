import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { User, ShoppingBag, CreditCard, Bell, HelpCircle, ChevronRight, LogOut, Phone, Mail, Edit2, Check, Wallet } from 'lucide-react';
import { getUser, saveUser, getOrders, getTokens, getWallet, getPin } from '../components/localData';
import PinPad from '../components/PinPad';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tokens, setTokens] = useState({ total: 0 });
  const [wallet, setWallet] = useState({ balance: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showPin, setShowPin] = useState(false);
  const hasPin = !!getPin();

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setForm({ full_name: u.full_name || '', email: u.email || '', phone: u.phone || '', address: u.address || '' });
    setOrders(getOrders());
    setTokens(getTokens());
    setWallet(getWallet());
  }, []);

  const saveProfile = () => {
    const updated = saveUser(form);
    setUser(updated);
    setEditing(false);
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const menuItems = [
    { icon: ShoppingBag, label: 'Order History', page: 'History', count: orders.length },
    { icon: CreditCard, label: 'Payment Methods', page: 'PaymentMethods', count: null },
    { icon: Wallet, label: 'My Wallet', page: 'WalletPage', count: null, sub: `₹${wallet.balance.toFixed(2)}` },
    { icon: Bell, label: 'Notifications', page: 'Notifications', count: null },
    { icon: HelpCircle, label: 'Help & Support', page: 'HelpSupport', count: null },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <button onClick={() => editing ? saveProfile() : setEditing(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border ${editing ? 'border-green-500 text-green-400 bg-[#22c55e]/10' : 'border-gray-700 text-gray-400'}`}>
          {editing ? <><Check className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
        </button>
      </div>

      {/* User Card */}
      <div className="px-6">
        <div className="bg-gray-900 rounded-3xl p-6 border border-yellow-400/30">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-white/10 backdrop-blur-md border border-gray-600 rounded-xl px-3 py-2 text-white text-sm outline-none mb-1" placeholder="Full Name" />
              ) : (
                <h2 className="text-xl font-bold truncate">{user?.full_name || 'Guest User'}</h2>
              )}
              <p className="text-gray-400 text-sm truncate">{user?.email || 'guest@stickypay.app'}</p>
            </div>
          </div>

          {/* Detail fields */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
              <Phone className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              {editing ? (
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="flex-1 bg-transparent text-white text-sm outline-none" placeholder="Mobile number" />
              ) : (
                <span className="text-sm text-gray-300">{user?.phone || 'Add mobile number'}</span>
              )}
            </div>
            <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              {editing ? (
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="flex-1 bg-transparent text-white text-sm outline-none" placeholder="Email" />
              ) : (
                <span className="text-sm text-gray-300">{user?.email || 'Add email'}</span>
              )}
            </div>
            {editing && (
              <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
                <span className="text-yellow-400 text-sm flex-shrink-0">📍</span>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="flex-1 bg-transparent text-white text-sm outline-none" placeholder="Address" />
              </div>
            )}
            {!editing && user?.address && (
              <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
                <span className="text-yellow-400 text-sm">📍</span>
                <span className="text-sm text-gray-300">{user.address}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{orders.length}</p>
              <p className="text-gray-400 text-xs">Orders</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#22c55e]">₹{totalSpent.toFixed(0)}</p>
              <p className="text-gray-400 text-xs">Spent</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">🪙 {tokens.total.toFixed(1)}</p>
              <p className="text-gray-400 text-xs">Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* StickyCoins Banner */}
      {tokens.total > 0 && (
        <div className="px-6 mt-4">
          <div className="bg-gradient-to-r from-yellow-400/20 to-green-500/20 border border-yellow-400/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <p className="font-bold text-yellow-400">{tokens.total.toFixed(2)} StickyCoins</p>
              <p className="text-gray-400 text-xs">Worth ₹{tokens.total.toFixed(2)} · Use at checkout</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-6 mt-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} onClick={() => navigate(createPageUrl(item.page))}
              className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.sub && <span className="text-green-400 text-sm font-semibold">{item.sub}</span>}
                {item.count !== null && item.count > 0 && (
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">{item.count}</span>
                )}
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="px-6 mt-4">
        <button onClick={() => setShowPin(true)}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium">
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {showPin && (
        <PinPad
          title={hasPin ? 'Enter PIN to Log Out' : 'Set PIN to Continue'}
          isSetup={!hasPin}
          onSuccess={() => {
            setShowPin(false);
            localStorage.clear();
            navigate('/Login');
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}