import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Store, Calendar, CreditCard, ShieldCheck, Home, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { supabase } from "../lib/supabase";

// Generates a realistic-looking QR code using SVG
function QRCode({ data }) {
    const SIZE = 200;
    const MODULES = 25;
    const CELL = SIZE / MODULES;

    // Deterministic seeded random based on data string
    const seeded = useMemo(() => {
        let seed = 0;
        for (let i = 0; i < data.length; i++) seed = (seed * 31 + data.charCodeAt(i)) & 0xffffffff;
        const rand = () => { seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5; return (seed >>> 0) / 0xffffffff; };
        return rand;
    }, [data]);

    const grid = useMemo(() => {
        const rand = seeded;
        const g = Array.from({ length: MODULES }, () => Array(MODULES).fill(false));

        // Fill random modules
        for (let r = 0; r < MODULES; r++)
            for (let c = 0; c < MODULES; c++)
                g[r][c] = rand() > 0.45;

        // Finder patterns (top-left, top-right, bottom-left) — 7x7
        const finder = (row, col) => {
            for (let r = 0; r < 7; r++)
                for (let c = 0; c < 7; c++) {
                    const outer = r === 0 || r === 6 || c === 0 || c === 6;
                    const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    g[row + r][col + c] = outer || inner;
                }
            // Separator
            for (let i = 0; i <= 7; i++) {
                if (row + 7 < MODULES && col + i < MODULES) g[row + 7][col + i] = false;
                if (row + i < MODULES && col + 7 < MODULES) g[row + i][col + 7] = false;
            }
        };

        finder(0, 0);
        finder(0, MODULES - 7);
        finder(MODULES - 7, 0);

        // Timing patterns
        for (let i = 8; i < MODULES - 8; i++) {
            g[6][i] = i % 2 === 0;
            g[i][6] = i % 2 === 0;
        }
        return g;
    }, [seeded]);

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <rect width={SIZE} height={SIZE} fill="white" />
            {grid.map((row, r) =>
                row.map((filled, c) =>
                    filled ? (
                        <rect
                            key={`${r}-${c}`}
                            x={c * CELL}
                            y={r * CELL}
                            width={CELL}
                            height={CELL}
                            fill="black"
                        />
                    ) : null
                )
            )}
        </svg>
    );
}

export default function QRReceipt({ order: initialOrder }) {
    const navigate = useNavigate();
    // Poll for real-time status update (security guard verification)
    const [order, setOrder] = useState(initialOrder);

    useEffect(() => {
        const channel = supabase
            .channel('orders')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${initialOrder.id}`
                },
                payload => {
                    setOrder(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [initialOrder?.id]);

    const isVerified = order?.status === 'verified';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-3xl p-6 mx-4 border border-gray-800 w-full max-w-sm"
        >
            {/* Success Header */}
            <div className="text-center mb-6">
                <motion.div
                    key={isVerified ? 'verified' : 'paid'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isVerified ? 'bg-blue-500' : 'bg-green-500'}`}
                >
                    {isVerified ? <ShieldCheck className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-black" />}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">{isVerified ? 'Checked Out!' : 'Payment Successful!'}</h2>
                <p className="text-gray-400 mt-1 text-sm">
                    {isVerified ? 'Security has verified your exit ✓' : 'Show this QR to security at exit'}
                </p>
            </div>

            {/* QR Code */}
            <div className={`rounded-2xl p-4 mb-4 flex flex-col items-center border-4 ${isVerified ? 'bg-white border-blue-400' : 'bg-white border-transparent'}`}>
                <QRCode data={order?.id} />
                <p>
                    {order?.id}
                </p>
                {isVerified && (
                    <div className="mt-2 flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/40 rounded-xl px-3 py-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-400 text-xs font-semibold">Security Verified</span>
                    </div>
                )}
            </div>

            {/* Awaiting Verification Banner */}
            {!isVerified && (
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <div>
                        <p className="text-orange-400 font-semibold text-sm">Awaiting Security Check</p>
                        <p className="text-gray-400 text-xs">Show this QR to the guard at exit. Status updates automatically.</p>
                    </div>
                </div>
            )}

            {/* Tokens earned */}
            {order?._tokensEarned && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                >
                    <span className="text-2xl">🪙</span>
                    <div>
                        <p className="text-yellow-400 font-bold text-sm">+{order._tokensEarned} StickyCoins earned!</p>
                        <p className="text-gray-400 text-xs">Redeem on your next order</p>
                    </div>
                </motion.div>
            )}

            {/* Order Details */}
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-300">
                    <Store className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500">Store</p>
                        <p className="font-medium">{order?.store_name || 'Store Name'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                    <Calendar className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="font-medium">
                            {order?.created_date ? format(new Date(order.created_date), 'MMM dd, yyyy • HH:mm') : format(new Date(), 'MMM dd, yyyy • HH:mm')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                    <CreditCard className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">{order?.payment_method || 'Card'}</p>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Items ({order?.items?.length || 0})</span>
                        <span className="text-gray-300">₹{order?.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-base font-bold text-white">Total Paid</span>
                        <span className="text-xl font-bold text-green-500">₹{order?.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
            </div>

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
