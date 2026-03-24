import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Store,
  Calendar,
  CreditCard,
  ShieldCheck,
  Home,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { supabase } from "../lib/supabase";
import QRCode from "react-qr-code";

export default function QRReceipt({ order: initialOrder }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(initialOrder);

  // ✅ REALTIME UPDATE (UNCHANGED LOGIC)
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

      {/* 🔥 HEADER (MATCHED TO REFERENCE) */}
      <div className="text-center mb-6">
        <motion.div
          key={isVerified ? 'verified' : 'paid'}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
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

        <p className="text-gray-400 mt-1 text-sm">
          {isVerified
            ? 'Security has verified your exit ✓'
            : 'Show this QR to security at exit'}
        </p>
      </div>

      {/* 🔥 QR (UNCHANGED LOGIC, PREMIUM UI ADDED) */}
      <div className={`rounded-2xl p-4 mb-4 flex flex-col items-center border-4 ${
        isVerified
          ? 'bg-white border-blue-400'
          : 'bg-white border-orange-400'
      }`}>
        <QRCode
          value={order?.transaction_id || ""}
          size={200}
        />

        <p className="text-center text-black text-xs mt-3 font-mono tracking-widest">
          {order?.transaction_id}
        </p>

        {isVerified && (
          <div className="mt-2 flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/40 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-400 text-xs font-semibold">
              Security Verified
            </span>
          </div>
        )}
      </div>

      {/* 🔥 STATUS BANNER (MATCHED) */}
      {!isVerified && (
        <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-orange-400 font-semibold text-sm">
              Awaiting Security Check
            </p>
            <p className="text-gray-400 text-xs">
              Show this QR to the guard at exit. Status updates automatically.
            </p>
          </div>
        </div>
      )}

      {/* 🔥 ORDER DETAILS (MATCHED STYLE) */}
      <div className="space-y-3 text-sm">

        <div className="flex items-center gap-3 text-gray-300">
          <Store className="w-4 h-4 text-yellow-400" />
          <div>
            <p className="text-xs text-gray-500">Store</p>
            <p className="font-medium">{order?.store_name || 'Store'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-300">
          <Calendar className="w-4 h-4 text-yellow-400" />
          <div>
            <p className="text-xs text-gray-500">Date & Time</p>
            <p className="font-medium">
              {order?.created_at
                ? format(new Date(order.created_at + 'Z'), 'dd MMM yyyy, hh:mm a')
                : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-300">
          <CreditCard className="w-4 h-4 text-yellow-400" />
          <div>
            <p className="text-xs text-gray-500">Payment Method</p>
            <p className="font-medium capitalize">
              {order?.payment_method || 'N/A'}
            </p>
          </div>
        </div>

        {/* 🔥 ITEMS COUNT (NEW - MATCHES REFERENCE) */}
        <div className="border-t border-gray-800 pt-3 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              Items ({order?.items?.length || 0})
            </span>
            <span className="text-gray-300">
              ₹{order?.total_amount?.toFixed(2) || '0.00'}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-base font-bold text-white">Total Paid</span>
            <span className="text-xl font-bold text-green-500">
              ₹{order?.total_amount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔥 BUTTON */}
      <button
        onClick={() => navigate(createPageUrl('Home'))}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-gray-800 rounded-xl text-gray-300 text-sm font-medium"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </button>
    </motion.div>
  );
}