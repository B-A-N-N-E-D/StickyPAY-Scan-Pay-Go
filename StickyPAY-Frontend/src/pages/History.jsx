import React, { useState, useEffect } from 'react';
import {
  Receipt, ChevronDown, ChevronUp, CreditCard, Wallet, Smartphone,
  CheckCircle2, Download, ShieldCheck, X
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';

// Payment icon
const paymentIcon = (method) => {
  if (method === 'card') return <CreditCard className="w-4 h-4" />;
  if (method === 'wallet') return <Wallet className="w-4 h-4" />;
  return <Smartphone className="w-4 h-4" />;
};

// Invoice
const downloadInvoice = (order) => {
  let itemLines = [];

  if (order.items && Array.isArray(order.items)) {
    itemLines = order.items.map((item, i) =>
      `${i + 1}. ${item.name} x${item.qty} - ₹${item.price * item.qty}`
    );
  }

  const lines = [
    '========================================',
    '           StickyPAY INVOICE            ',
    '========================================',
    `Transaction ID : ${order.transaction_id || 'N/A'}`,
    `Date & Time    : ${order.created_at ? format(new Date(order.created_at + 'Z'), 'dd MMM yyyy, hh:mm a') : '—'}`,
    `Store          : ${order.store_name || '—'}`,
    `Payment Mode   : ${order.payment_method || '—'}`,
    `Status         : ${order.verified ? 'verified' : 'pending'}`,
    '----------------------------------------',
    'Items:',
    ...(itemLines.length ? itemLines : ['No items found']),
    '----------------------------------------',
    `TOTAL PAID     : ₹${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}`,
    '========================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${order.transaction_id || "order"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function History() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [enlargedQr, setEnlargedQr] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setOrders(data || []);
      else console.error(error);
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-gray-400 mt-1">All your past purchases</p>
      </div>

      <div className="px-6 space-y-3 pb-6">
        {orders.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No purchase history</p>
          </div>
        )}

        {orders.map((order) => {
          const status = order.verified ? 'verified' : 'pending';

          return (
            <div key={order.order_id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

              {/* HEADER */}
              <button
                className="w-full p-4 text-left flex items-center justify-between"
                onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    status === 'verified' ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    {status === 'verified'
                      ? <ShieldCheck className="w-5 h-5 text-blue-400" />
                      : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </div>

                  <div>
                    <p className="font-semibold text-white">{order.store_name || 'Store'}</p>
                    <p className="text-gray-500 text-xs">
                      {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a') : '—'}
                    </p>
                    <span className={`text-xs font-semibold ${status === 'verified' ? 'text-blue-400' : 'text-orange-400'}`}>
                      {status === 'verified' ? '✓ Security Verified' : '⏳ Pending security check'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-base">
                    ₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                  </span>
                  {expandedOrder === order.order_id
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {/* DETAILS */}
              {expandedOrder === order.order_id && (
                <div className="border-t border-gray-800 px-4 pt-4 pb-4 space-y-4">

                  {/* 🔥 QR WITH ORANGE BORDER */}
                  <div
                    className="flex items-center gap-4 bg-gray-800 rounded-xl p-3 border cursor-pointer"
                    onClick={() => setEnlargedQr(order)}
                  >
                    <div className="bg-white p-2 rounded-xl border-4 border-orange-500 shadow-[0_0_15px_rgba(255,115,0,0.6)]">
                      <QRCode value={order?.transaction_id || "INVALID"} size={80} />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Receipt QR</p>
                      <p className="text-white font-mono text-xs truncate">
                        {order?.transaction_id || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* META */}
                  <div className="bg-gray-800/60 rounded-xl p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="text-white font-mono text-xs">
                        {order?.transaction_id || "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment</span>
                      <span className="flex items-center gap-1 text-white">
                        {paymentIcon(order.payment_method)}
                        {order.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* 🧾 ITEMS LIST 👉 ADD HERE */}
                  {order.items && Array.isArray(order.items) && (
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-2 text-sm">
                      <p className="text-gray-400 font-semibold mb-1">Items</p>

                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-white">
                          <span>
                            {item.name} x{item.qty}
                          </span>
                          <span className="text-yellow-400">
                            ₹{(item.price * item.qty).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                    <span className="font-semibold text-white">Total Paid</span>
                    <span className="text-xl font-bold text-yellow-400">
                      ₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <Button onClick={() => downloadInvoice(order)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔥 MODAL WITH PREMIUM QR */}
      {enlargedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="bg-[#0f172a] p-8 rounded-3xl text-center relative border border-gray-800">

            <button onClick={() => setEnlargedQr(null)} className="absolute top-4 right-4 text-gray-400">
              <X />
            </button>

            <h2 className="text-white text-xl font-bold mb-4">
              Security QR Code
            </h2>

            <div className="bg-white p-4 rounded-2xl border-4 border-orange-500 shadow-[0_0_25px_rgba(255,115,0,0.7)]">
              <QRCode value={enlargedQr?.transaction_id || "INVALID"} size={220} />
            </div>

            <p className="mt-4 text-gray-300 font-mono">
              {enlargedQr?.transaction_id}
            </p>

            <div className="mt-4 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-xl text-sm font-semibold">
              ⏳ Pending Security Check
            </div>
          </div>
        </div>
      )}
    </div>
  );
}