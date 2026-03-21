import React, { useState, useEffect } from 'react';
import {
  Receipt, ChevronDown, ChevronUp, CreditCard, Wallet, Smartphone,
  Store, CheckCircle2, Package, Download, ShieldCheck, Clock, X
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';

// Payment icon helper
const paymentIcon = (method) => {
  if (method === 'card') return <CreditCard className="w-4 h-4" />;
  if (method === 'wallet') return <Wallet className="w-4 h-4" />;
  return <Smartphone className="w-4 h-4" />;
};

// Download invoice
const downloadInvoice = (order) => {
  const lines = [
    '========================================',
    '           StickyPAY INVOICE            ',
    '========================================',
    `Transaction ID : ${order.transaction_id}`,
    `Date & Time    : ${order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a') : '—'}`,
    `Store          : ${order.store_name || '—'}`,
    `Payment Mode   : ${order.payment_method || '—'}`,
    `Status         : ${order.verified ? 'verified' : 'pending'}`,
    '----------------------------------------',
    `TOTAL PAID     : ₹${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}`,
    '========================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${order.transaction_id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function History() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [enlargedQr, setEnlargedQr] = useState(null);

  // 🔥 FETCH FROM SUPABASE
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setOrders(data);
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
                className="w-full p-4 flex justify-between items-center"
                onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
              >
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    status === 'verified' ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    {status === 'verified'
                      ? <ShieldCheck className="text-blue-400" />
                      : <CheckCircle2 className="text-green-500" />}
                  </div>

                  <div>
                    <p className="font-semibold">{order.store_name}</p>
                    <p className="text-xs text-gray-500">
                      {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a') : ''}
                    </p>
                    <p className="text-xs">
                      {status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold">
                    ₹{order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                  </span>
                  {expandedOrder === order.order_id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </button>

              {/* DETAILS */}
              {expandedOrder === order.order_id && (
                <div className="p-4 space-y-4 border-t border-gray-800">

                  {/* QR */}
                  <div
                    className="bg-white p-3 rounded-xl cursor-pointer"
                    onClick={() => setEnlargedQr(order)}
                  >
                    <QRCode value={order.transaction_id} size={100} />
                  </div>

                  {/* META */}
                  <div className="space-y-2 text-sm">
                    <p><b>Transaction:</b> {order.transaction_id}</p>
                    <p><b>Store:</b> {order.store_name}</p>
                    <p><b>Payment:</b> {order.payment_method}</p>
                    <p><b>Status:</b> {status}</p>
                  </div>

                  {/* DOWNLOAD */}
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

      {/* 🔥 ENLARGED QR */}
      {enlargedQr && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <QRCode value={enlargedQr.transaction_id} size={200} />
            <p className="mt-4">{enlargedQr.transaction_id}</p>
            <button onClick={() => setEnlargedQr(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}