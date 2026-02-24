import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';

const ALL_OFFERS = [
  { code: 'SAVE10', title: '10% Off', desc: 'Get 10% off on orders above ₹500', min: 500, type: 'percent', value: 10, store: 'All Stores', color: 'from-yellow-400 to-orange-400' },
  { code: 'NEWUSER', title: '₹50 Off', desc: 'Flat ₹50 off for new users on first order', min: 200, type: 'flat', value: 50, store: 'All Stores', color: 'from-green-400 to-teal-500' },
  { code: 'UPI5', title: '5% Cashback', desc: '5% cashback when you pay via UPI', min: 100, type: 'cashback', value: 5, store: 'All Stores', color: 'from-blue-400 to-purple-500' },
  { code: 'WEEKEND20', title: '20% Off', desc: 'Weekend special — 20% off every Saturday & Sunday', min: 300, type: 'percent', value: 20, store: 'Demo Store', color: 'from-pink-400 to-rose-500' },
  { code: 'GROCERY15', title: '15% Off', desc: '15% off on all grocery items', min: 250, type: 'percent', value: 15, store: 'Demo Store', color: 'from-lime-400 to-green-500' },
];

export default function Offers() {
  const [copied, setCopied] = useState('');

  const copy = (code) => {
    navigator.clipboard.writeText(code).catch(() => { });
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-5 h-5 text-yellow-400" />
          <h1 className="text-2xl font-bold">Offers</h1>
        </div>
        <p className="text-gray-400 text-sm">Tap the code to copy & use at checkout</p>
      </div>

      <div className="px-6 space-y-4 pb-8">
        {ALL_OFFERS.map(offer => (
          <div key={offer.code} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${offer.color}`} />
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-lg">{offer.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{offer.desc}</p>
                  <p className="text-gray-500 text-xs mt-2">Min. order: ₹{offer.min} · {offer.store}</p>
                </div>
              </div>
              <button
                onClick={() => copy(offer.code)}
                className="mt-4 w-full flex items-center justify-between bg-gray-800 border border-dashed border-gray-600 rounded-xl px-4 py-3"
              >
                <span className="font-mono font-bold text-yellow-400 tracking-widest text-sm">{offer.code}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {copied === offer.code ? <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></> : <><Copy className="w-4 h-4" />Copy</>}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}