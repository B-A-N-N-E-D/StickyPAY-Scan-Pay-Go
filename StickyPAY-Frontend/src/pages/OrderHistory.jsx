import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, ChevronDown, ChevronUp, CreditCard, Wallet, Smartphone, Store, CheckCircle2, Package, Download } from 'lucide-react';
import { getOrders } from '../components/localData';

import { Button } from '@/components/ui/button';

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
    `Payment Mode   : ${order.payment?.payment_method || '—'}`,
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
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${order.qr_code_data || order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { setOrders(getOrders()); }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-gray-400 text-sm">{orders.length} orders</p>
        </div>
      </div>

      <div className="px-6 space-y-3 pb-6">
        {orders.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No orders yet</p>
            <p className="text-gray-600 text-sm mt-1">Your receipts will appear here after checkout</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-md overflow-hidden">
            <button
              className="w-full p-4 text-left flex items-center justify-between"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-white">{order.store_name || 'Store'}</p>
                  <p className="text-gray-500 text-xs">
                    {order.created_date ? format(new Date(order.created_date), 'dd MMM yyyy, hh:mm a') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">₹{order.total_amount?.toFixed(2)}</span>
                {expandedOrder === order.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>

            {expandedOrder === order.id && (
              <div className="border-t border-gray-800 px-4 pt-4 pb-4 space-y-4">
                <div className="bg-white/10 backdrop-blur-md/60 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="text-white font-mono text-xs truncate max-w-[160px]">{order.qr_code_data || order.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Mode</span>
                    <span className="flex items-center gap-1.5 text-white capitalize">
                      {paymentIcon(order.payment?.payment_method)}{order.payment?.payment_method || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Store</span>
                    <span className="flex items-center gap-1.5 text-white"><Store className="w-4 h-4" />{order.store_name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    <span className="text-green-400 font-semibold capitalize">{order.status}</span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Items</p>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 text-sm">
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

                <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                  <span className="font-semibold text-white">Total Paid</span>
                  <span className="text-xl font-bold text-yellow-400">₹{order.total_amount?.toFixed(2)}</span>
                </div>

                <Button
                  onClick={() => downloadInvoice(order)}
                  className="w-full bg-white/10 backdrop-blur-md hover:bg-gray-700 text-white border border-gray-700 py-3 rounded-xl flex items-center justify-center gap-2"
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