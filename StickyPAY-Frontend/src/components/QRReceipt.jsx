import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Store,
  Calendar,
  CreditCard,
  Wallet,
  Smartphone,
  ShieldCheck,
  Home,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { supabase } from "../lib/supabase";
import QRCode from "react-qr-code";

// 🔥 Payment Icon
const paymentIcon = (method) => {
  switch (method?.toLowerCase()) {
    case "card":
      return <CreditCard className="w-4 h-4" />;
    case "wallet":
      return <Wallet className="w-4 h-4" />;
    case "upi":
      return <Smartphone className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

export default function QRReceipt({ order: initialOrder }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(initialOrder);
  
  console.log("🔥 QR ORDER DATA:", order);

  // ✅ REALTIME UPDATE
  useEffect(() => {
    if (!initialOrder?.order_id) return;

    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${initialOrder.order_id}`
        },
        payload => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialOrder?.order_id]);

  const isVerified = order?.verified === true;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 rounded-3xl p-6 mx-4 border border-gray-800 w-full max-w-sm"
    >

      {/* HEADER */}
      <div className="text-center mb-6">
        <motion.div
          key={isVerified ? 'verified' : 'paid'}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isVerified ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {isVerified
            ? <ShieldCheck className="w-10 h-10 text-white" />
            : <CheckCircle2 className="w-10 h-10 text-black" />}
        </motion.div>

        <h2 className="text-2xl font-bold text-white">
          {isVerified ? 'Checked Out!' : 'Payment Successful!'}
        </h2>

        <p className="text-gray-400 text-sm">
          {isVerified
            ? 'Security has verified your exit ✓'
            : 'Show this QR to security'}
        </p>
      </div>

      {/* QR */}
      <div className={`rounded-2xl p-4 mb-4 flex flex-col items-center border-4 ${
        isVerified ? 'bg-white border-blue-400' : 'bg-white border-orange-400'
      }`}>
        <QRCode value={order?.transaction_id || ""} size={200} />

        <p className="text-black text-xs mt-3 font-mono">
          {order?.transaction_id}
        </p>

        {isVerified && (
          <div className="mt-2 flex items-center gap-1 bg-blue-500/10 border border-blue-400 px-3 py-1 rounded-xl">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-xs">Verified</span>
          </div>
        )}
      </div>

      {/* STATUS */}
      {!isVerified && (
        <div className="bg-orange-500/10 border border-orange-400 rounded-xl p-3 mb-4 flex gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-orange-400 text-sm font-semibold">
              Awaiting Security Check
            </p>
            <p className="text-gray-400 text-xs">
              Show this QR at exit
            </p>
          </div>
        </div>
      )}

      {/* 🔥 FULL DETAILS */}
      <div className="bg-gray-800/60 rounded-xl p-3 space-y-2 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-500">Transaction ID</span>
          <span className="text-white font-mono text-xs">
            {order?.transaction_id || "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Payment</span>
          <span className="flex items-center gap-2 text-white capitalize">
            {paymentIcon(order?.payment_method)}
            {order?.payment_method || "upi"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Store</span>
          <span className="text-white">
            {order?.store_name || "Store"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Status</span>
          <span className={`font-semibold ${
            isVerified ? "text-blue-400" : "text-orange-400"
          }`}>
            {isVerified ? "Verified" : "Pending"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Date & Time</span>
          <span className="text-white">
            {order?.created_at
              ? new Date(order.created_at).toLocaleString()
              : '—'}
          </span>
        </div>
      </div>

      {/* 🔥 ITEMS */}
      {order?.order_items?.length > 0 && (
        <div className="bg-gray-800/60 rounded-xl p-3 mt-3 space-y-2 text-sm">
          <p className="text-gray-400 font-semibold">Items</p>

          {order?.order_items?.map((item, i) => {
            const qty = item.quantity || 1;
            const price = item.price || 0;

            return (
              <div key={i} className="flex justify-between text-white">
                <span>{item.product?.name || "Item"} x{qty}</span>
                <span className="text-yellow-400">
                  ₹{(price * qty).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* TOTAL */}
      <div className="flex justify-between items-center border-t border-gray-700 pt-3 mt-3">
        <span className="font-semibold text-white">Total Paid</span>
        <span className="text-xl font-bold text-yellow-400">
          ₹{Number(order?.total_amount || 0).toFixed(2)}
        </span>
      </div>

      {/* BUTTON */}
      <button
        onClick={() => navigate(createPageUrl('Home'))}
        className="mt-5 w-full py-3 bg-gray-800 rounded-xl text-gray-300 text-sm"
      >
        Back to Home
      </button>
    </motion.div>
  );
}