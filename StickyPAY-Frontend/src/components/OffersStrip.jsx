import React from 'react';
import { Tag } from 'lucide-react';

const OFFERS = [
    { code: 'SAVE10', desc: '10% off on orders above ₹500', color: 'from-yellow-400 to-yellow-500' },
    { code: 'NEWUSER', desc: 'Flat ₹50 off for new users', color: 'from-green-400 to-green-500' },
    { code: 'UPI5', desc: '5% cashback on UPI payments', color: 'from-blue-400 to-blue-500' },
];

export default function OffersStrip({ onViewAll }) {
    return (
        <div className="px-6 mt-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-sm">Offers & Coupons</h3>
                </div>
                <button onClick={onViewAll} className="text-yellow-400 text-xs font-medium">View All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {OFFERS.map(o => (
                    <div key={o.code} className={`flex-shrink-0 bg-gradient-to-r ${o.color} rounded-2xl p-4 w-52`}>
                        <p className="text-black font-bold text-base tracking-widest">{o.code}</p>
                        <p className="text-black/70 text-xs mt-1">{o.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}