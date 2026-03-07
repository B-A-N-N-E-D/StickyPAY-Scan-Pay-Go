import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { ScanLine, ArrowRight, Sparkles, Tag, Copy, Check, Store, TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, getOrders } from '../components/localData';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreContext } from "@/lib/StoreContext";

const ALL_OFFERS = [
  { code: 'SAVE10', title: '10% Off', desc: 'Get 10% off on orders above ₹500', min: 500, type: 'percent', value: 10, store: 'All Stores', color: 'from-yellow-400 to-orange-400', storeKey: null },
  { code: 'NEWUSER', title: '₹50 Off', desc: 'Flat ₹50 off for new users on first order', min: 200, type: 'flat', value: 50, store: 'All Stores', color: 'from-green-400 to-teal-500', storeKey: null },
  { code: 'UPI5', title: '5% Cashback', desc: '5% cashback when you pay via UPI', min: 100, type: 'cashback', value: 5, store: 'All Stores', color: 'from-blue-400 to-purple-500', storeKey: null },
  { code: 'WEEKEND20', title: '20% Off', desc: 'Weekend special — 20% off every Saturday & Sunday', min: 300, type: 'percent', value: 20, store: 'Demo Store', color: 'from-pink-400 to-rose-500', storeKey: 'Demo Store' },
  { code: 'GROCERY15', title: '15% Off', desc: '15% off on all grocery items', min: 250, type: 'percent', value: 15, store: 'Demo Store', color: 'from-lime-400 to-green-500', storeKey: 'Demo Store' },
  { code: 'FRESH25', title: '25% Off', desc: 'Fresh produce discount - fruits & vegetables', min: 150, type: 'percent', value: 25, store: 'FreshMart', color: 'from-emerald-400 to-cyan-500', storeKey: 'FreshMart' },
  { code: 'DAILY5', title: '₹5 Off', desc: 'Daily shopper reward on every visit', min: 50, type: 'flat', value: 5, store: 'All Stores', color: 'from-violet-400 to-indigo-500', storeKey: null },
];

export default function Home() {
  const navigate = useNavigate();
  const { activeStore: currentStore } = useContext(StoreContext);
  const [greeting, setGreeting] = useState('');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u || !u.full_name) {
      navigate(createPageUrl('Login'));
      return;
    }
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    setUser(u);
    setOrders(getOrders());
  }, [navigate]);

  const copy = (code) => {
    navigator.clipboard.writeText(code).catch(() => { });
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  // Filter offers: if store active, show store-specific + all stores; else show all
  const visibleOffers = currentStore
    ? ALL_OFFERS.filter(o => !o.storeKey || o.storeKey === currentStore.name)
    : ALL_OFFERS;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-6 pt-6 pb-4"
      >
        <p className="text-gray-400 text-sm">{greeting}</p>
        <h1 className="text-3xl font-bold mt-1">{user?.full_name?.split(' ')[0] || 'Shopper'} 👋</h1>
      </motion.div>

      {/* Main Action Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="px-6"
      >
        <Link to={createPageUrl('Scanner')} className="block">
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-green-500 rounded-3xl p-6 relative overflow-hidden group active:scale-[0.98] transition-transform duration-200 cursor-pointer">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
            <div className="relative z-10">
              <h2 className="text-black text-2xl font-bold mb-2">{currentStore ? 'Scan Items' : 'Start Shopping'}</h2>
              <p className="text-black/70 mb-5 text-sm">
                {currentStore ? `Scan products at ${currentStore.name}` : 'Scan store QR to begin seamless checkout'}
              </p>
              <div className="inline-flex items-center gap-2 bg-black text-yellow-400 font-semibold px-5 py-3 rounded-xl text-sm group-hover:gap-3 transition-all duration-300">
                <ScanLine className="w-4 h-4" />
                {currentStore ? 'Scan Barcode' : 'Scan Store QR'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Active Store Badge */}
      <AnimatePresence>
        {currentStore && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6"
          >
            <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Currently shopping at</p>
                <p className="text-sm font-bold text-yellow-400">{currentStore.name}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-lg font-medium">Active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="px-6 mt-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(createPageUrl('History'))}
            className="bg-gray-900 rounded-2xl p-4 border border-gray-800 cursor-pointer active:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 bg-yellow-400/20 rounded-xl flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(createPageUrl('Scanner'))}
            className="bg-gray-900 rounded-2xl p-4 border border-gray-800 cursor-pointer active:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">Fast</p>
            <p className="text-gray-500 text-sm">Checkout</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity Section */}
      {orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="px-6 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-yellow-400" /> Recent Activity
            </h3>
            <button
              onClick={() => navigate(createPageUrl('History'))}
              className="text-yellow-400 text-xs font-medium flex items-center gap-1"
            >
              See All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{order.store_name || 'Store'}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">{order.created_date ? new Date(order.created_date).toLocaleDateString() : 'Unknown date'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">₹{Number(order.total_amount || 0).toFixed(2)}</p>
                  <p className="text-green-500 text-xs font-medium flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3" /> Paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Offers Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 mt-6 pb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-semibold">
              {currentStore ? `Offers at ${currentStore.name}` : 'Available Offers'}
            </h3>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl('Offers'))}
            className="text-yellow-400 text-xs font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {visibleOffers.map((offer, i) => (
              <motion.div
                key={offer.code}
                variants={itemVariants}
                whileHover={{ scale: 1.015, y: -2 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${offer.color}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base">{offer.title}</span>
                        {offer.storeKey === currentStore?.name && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">Store Deal</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{offer.desc}</p>
                      <p className="text-gray-600 text-xs mt-1.5">Min. ₹{offer.min} · {offer.store}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => copy(offer.code)}
                    className="mt-3 w-full flex items-center justify-between bg-gray-800 border border-dashed border-gray-600 rounded-xl px-4 py-3 transition-colors"
                  >
                    <span className="font-mono font-bold text-yellow-400 tracking-widest text-sm">{offer.code}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      {copied === offer.code
                        ? <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                        : <><Copy className="w-4 h-4" />Copy</>}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
