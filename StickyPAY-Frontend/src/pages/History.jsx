import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, CreditCard, Wallet, Smartphone,
  CheckCircle2, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { supabase } from '../lib/supabase';

// Payment icon
const paymentIcon = (method) => {
  if (method === 'card') return <CreditCard className="w-4 h-4" />;
  if (method === 'wallet') return <Wallet className="w-4 h-4" />;
  return <Smartphone className="w-4 h-4" />;
};

// Extract items safely (IMPORTANT FIX)
const getItems = (order) => {
  return order.payments?.payment_items?.map(item => ({
    name: item.products?.name || "Item",
    quantity: item.quantity || 1,
    price: item.price || 0
  })) || [];
};

// Invoice (UNCHANGED LOGIC)
const downloadInvoice = (order) => {
  const items = getItems(order);

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
    'ITEMS',
    '----------------------------------------',
    ...items.map((item, i) =>
      `${i + 1}. ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`
    ),
    '----------------------------------------',
    `TOTAL PAID     : ₹${order.amount?.toFixed(2)}`,
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
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        payments(
          *,
          payment_items(
            quantity,
            price,
            products(name)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
  };

  return (
    <div className="p-4 space-y-4">
      {orders.map((order) => {
        const isOpen = openId === order.id;
        const items = getItems(order);

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow-md p-4 border hover:shadow-lg transition"
          >
            {/* HEADER */}
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setOpenId(isOpen ? null : order.id)}
            >
              <div>
                <p className="font-semibold text-lg">
                  ₹{order.amount?.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {order.store_name}
                </p>
                <p className="text-xs text-gray-400">
                  {order.created_at &&
                    format(new Date(order.created_at + 'Z'), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {paymentIcon(order.payment_method)}
                {order.verified && (
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                )}
                {isOpen ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {/* EXPANDED SECTION */}
            {isOpen && (
              <div className="mt-4 border-t pt-3 space-y-3">
                
                {/* ITEMS LIST (NEW UI FIX) */}
                <div>
                  <p className="font-semibold mb-2">Items</p>
                  {items.length > 0 ? (
                    items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1"
                      >
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No items found
                    </p>
                  )}
                </div>

                {/* TOTAL */}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>₹{order.amount?.toFixed(2)}</span>
                </div>

                {/* DOWNLOAD BUTTON */}
                <Button
                  className="w-full mt-2 flex items-center gap-2"
                  onClick={() => downloadInvoice(order)}
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}