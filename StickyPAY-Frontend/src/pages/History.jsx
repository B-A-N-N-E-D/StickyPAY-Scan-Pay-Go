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

// ✅ SAFE ITEM PARSER
const parseItems = (rawItems) => {
  try {
    if (typeof rawItems === "string") return JSON.parse(rawItems);
    if (Array.isArray(rawItems)) return rawItems;
  } catch (e) {
    console.error("Items parse error:", e);
  }
  return [];
};

// ✅ FIXED INVOICE FUNCTION
const downloadInvoice = (order) => {
  const items = order.items || [];

  const itemLines = items.length > 0
    ? items.map((item, i) =>
        `${i + 1}. ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`
      )
    : ['No items found'];

  let formattedDate = '—';
  try {
    const dateStr = order.created_at || order.created_date;
    if (dateStr) {
      formattedDate = format(new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`), 'dd MMM yyyy, hh:mm a');
    }
  } catch (e) {
    console.error("Date format error", e);
  }

  const lines = [
    '========================================',
    '           StickyPAY INVOICE            ',
    '========================================',
    `Transaction ID : ${order.transaction_id || order.qr_code_data || 'N/A'}`,
    `Date & Time    : ${formattedDate}`,
    `Store          : ${order.store_name || '—'}`,
    `Payment Mode   : ${order.payment?.payment_method || '—'}`,
    `Status         : ${order.verified || order.status === 'verified' ? 'Verified' : 'Pending'}`,
    '----------------------------------------',
    'ITEMS',
    '----------------------------------------',
    ...items.map(item => {
      const name = (item.name || 'Item').substring(0, 18).padEnd(20);
      const qty = item.quantity || 1;
      const price = item.price || 0;
      return `${name} x${qty}  ₹${(price * qty).toFixed(2)}`;
    }),
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
      try {
        const u = JSON.parse(localStorage.getItem('sp_user') || 'null');
        let onlineOrders = [];

        if (u?.id) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${u.id}`);
          if (res.ok) {
            const result = await res.json();
            const data = result.orders || [];
            onlineOrders = data.map(order => ({
              ...order,
              order_id: order.order_id || order.id,
              items: order.order_items?.map(item => ({
                name: item.product?.name || item.name || "Item",
                quantity: item.quantity || 1,
                price: item.price || 0
              })) || []
            }));
          }
        }

        // Fetch local offline orders
        const saved = localStorage.getItem('sp_orders');
        const localOrders = saved ? JSON.parse(saved) : [];
        const formattedLocal = localOrders.map(o => ({
          ...o,
          order_id: o.id || o.order_id,
          transaction_id: o.qr_code_data || o.transaction_id || o.id,
          verified: o.verified || o.status === 'verified',
          created_at: o.created_date || o.created_at || new Date().toISOString(),
          items: o.items || []
        }));

        // Combine and deduplicate
        const allOrders = [...onlineOrders, ...formattedLocal].filter((v, i, a) => a.findIndex(t => (
          (t.transaction_id && t.transaction_id === v.transaction_id) ||
          (t.order_id && t.order_id === v.order_id)
        )) === i);
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setOrders(allOrders);
      } catch (err) {
        console.error("❌ Fetch orders error:", err);
      }
    };

    // ✅ initial fetch
    fetchOrders();

    // ✅ delay refetch (CRITICAL)
    setTimeout(fetchOrders, 1000);

    // ✅ realtime (BEST)
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        fetchOrders
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          const items = order.items || [];
          const status = order.verified || order.status === 'verified' ? 'verified' : 'pending';

          let dateDisplay = '—';
          try {
            const dateStr = order.created_at || order.created_date;
            if (dateStr) {
               dateDisplay = format(new Date(dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`), 'dd MMM yyyy, hh:mm a');
            }
          } catch (e) {}

          return (
            <div key={order.order_id || Math.random()} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

              {/* HEADER */}
              <button
                className="w-full p-4 text-left flex items-center justify-between"
                onClick={() => setExpandedOrder(expandedOrder === (order.order_id || order.id) ? null : (order.order_id || order.id))}
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
                      {dateDisplay}
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
                  {expandedOrder === (order.order_id || order.id)
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {/* DETAILS */}
              {expandedOrder === (order.order_id || order.id) && (
                <div className="border-t border-gray-800 px-4 pt-4 pb-4 space-y-4">

                  {/* QR */}
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
                        {paymentIcon(order.payment?.payment_method)}
                        {order.payment?.payment_method || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* ✅ ITEMS LIST */}
                  {items.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-2 text-sm">
                      <p className="text-gray-400 font-semibold mb-1">Items</p>

                      {items.map((item, index) => {
                        const qty = item.quantity || item.qty || 1;
                        const price = item.price || 0;

                        return (
                          <div key={index} className="flex justify-between text-white">
                            <span>
                              {item.name || "Item"} x{qty}
                            </span>
                            <span className="text-yellow-400">
                              ₹{(price * qty).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
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

      {/* QR MODAL */}
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