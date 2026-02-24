import React, { useState, useEffect, useMemo } from 'react';
import { Receipt, ChevronDown, ChevronUp, CreditCard, Wallet, Smartphone, Store, CheckCircle2, Package, Download, ShieldCheck, Clock } from 'lucide-react';
import { getOrders } from '../components/localData';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

// Mini QR for history
function MiniQR({ data }) {
  const SIZE = 80;
  const MODULES = 25;
  const CELL = SIZE / MODULES;
  const seeded = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < data.length; i++) seed = (seed * 31 + data.charCodeAt(i)) & 0xffffffff;
    const rand = () => { seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff; };
    return rand;
  }, [data]);
  const grid = useMemo(() => {
    const rand = seeded;
    const g = Array.from({ length: MODULES }, () => Array(MODULES).fill(false));
    for (let r = 0; r < MODULES; r++) for (let c = 0; c < MODULES; c++) g[r][c] = rand() > 0.45;
    const finder = (row, col) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const outer = r === 0 || r === 6 || c === 0 || c === 6; const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4; g[row + r][col + c] = outer || inner; }
    };
    finder(0, 0); finder(0, MODULES - 7); finder(MODULES - 7, 0);
    for (let i = 8; i < MODULES - 8; i++) { g[6][i] = i % 2 === 0; g[i][6] = i % 2 === 0; }
    return g;
  }, [seeded]);
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="rounded">
      <rect width={SIZE} height={SIZE} fill="white" />
      {grid.map((row, r) => row.map((filled, c) => filled ? <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill="black" /> : null))}
    </svg>
  );
}

const paymentIcon = (method) => {
  if (method === 'card') return <CreditCard className="w-4 h-4" />;
  if (method === 'wallet') return <Wallet className="w-4 h-4" />;
  return <Smartphone className="w-4 h-4" />;
};

const downloadInvoice = (order) => {
  const lines = [
    '========================================',
    '           StickyPAY INVOICE            ',
    '========================================',
    `Transaction ID : ${order.qr_code_data || order.id}`,
    `Date & Time    : ${order.created_date ? format(new Date(order.created_date), 'dd MMM yyyy, hh:mm a') : '—'}`,
    `Store          : ${order.store_name || '—'}`,
    `Payment Mode   : ${order.payment_method || '—'}`,
    `Status         : ${order.status}`,
    '----------------------------------------',
    'ITEMS',
    '----------------------------------------',
    ...(order.items || []).map(item =>
      `${item.name.padEnd(20)} x${item.quantity}  ₹${(item.price * item.quantity).toFixed(2)}`
    ),
    '----------------------------------------',
    `TOTAL PAID     : ₹${order.total_amount?.toFixed(2)}`,
    '========================================',
    '        Thank you for shopping!         ',
    '========================================',
  ];

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${order.qr_code_data || order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function History() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    setOrders(getOrders());
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
            <p className="text-gray-600 text-sm mt-1">Your receipts will appear here after checkout</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Header Row */}
            <button
              className="w-full p-4 text-left flex items-center justify-between"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${order.status === 'verified' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                  {order.status === 'verified'
                    ? <ShieldCheck className="w-5 h-5 text-blue-400" />
                    : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                <div>
                  <p className="font-semibold text-white">{order.store_name || 'Store'}</p>
                  <p className="text-gray-500 text-xs">
                    {order.created_date ? format(new Date(order.created_date), 'dd MMM yyyy, hh:mm a') : '—'}
                  </p>
                  <span className={`text-xs font-semibold ${order.status === 'verified' ? 'text-blue-400' : 'text-orange-400'}`}>
                    {order.status === 'verified' ? '✓ Security Verified' : '⏳ Pending security check'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-base">₹{order.total_amount?.toFixed(2)}</span>
                {expandedOrder === order.id
                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                  : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="border-t border-gray-800 px-4 pt-4 pb-4 space-y-4">
                {/* QR Code */}
                <div className={`flex items-center gap-4 bg-gray-800 rounded-xl p-3 border ${order.status === 'verified' ? 'border-blue-500/40' : 'border-orange-500/30'}`}>
                  <div className="bg-white rounded-lg p-1 flex-shrink-0">
                    <MiniQR data={order.qr_code_data || order.id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Receipt QR</p>
                    <p className="text-white font-mono text-xs truncate">{order.qr_code_data || order.id}</p>
                    <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${order.status === 'verified' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {order.status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {order.status === 'verified' ? 'Security Verified' : 'Pending Security Check'}
                    </div>
                    {order.verified_date && (
                      <p className="text-gray-500 text-xs mt-1">Verified: {format(new Date(order.verified_date), 'dd MMM, hh:mm a')}</p>
                    )}
                  </div>
                </div>

                {/* Transaction Meta */}
                <div className="bg-gray-800/60 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="text-white font-mono text-xs truncate max-w-[160px]">{order.qr_code_data || order.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Mode</span>
                    <span className="flex items-center gap-1.5 text-white capitalize">
                      {paymentIcon(order.payment_method)}
                      {order.payment_method || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Store</span>
                    <span className="flex items-center gap-1.5 text-white">
                      <Store className="w-4 h-4" />
                      {order.store_name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-semibold capitalize flex items-center gap-1 ${order.status === 'verified' ? 'text-blue-400' : 'text-green-400'}`}>
                      {order.status === 'verified' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Date & Time</span>
                    <span className="text-white text-xs">
                      {order.created_date ? format(new Date(order.created_date), 'dd MMM yyyy, hh:mm a') : '—'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Items</p>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-800 rounded-xl px-3 py-2.5 text-sm">
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-gray-500 text-xs">₹{item.price?.toFixed(2)} × {item.quantity}</p>
                          </div>
                          <p className="text-yellow-400 font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                  <span className="font-semibold text-white">Total Paid</span>
                  <span className="text-xl font-bold text-yellow-400">₹{order.total_amount?.toFixed(2)}</span>
                </div>

                {/* Download Invoice */}
                <Button
                  onClick={() => downloadInvoice(order)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 py-3 rounded-xl flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Download className="w-4 h-4 text-yellow-400" />
                  Download Invoice
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}