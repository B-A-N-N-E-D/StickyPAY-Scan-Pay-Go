import React, { useRef, useContext, useState, useEffect } from 'react';
import { StoreContext } from "@/lib/StoreContext";
import { getCart, getUser, saveCart } from "../components/localData";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../lib/utils";
import BarcodeScanner from "../components/BarcodeScanner";
import { Store, ScanLine, ShoppingBag, RefreshCw, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Scanner() {
    const { activeStore, saveStore, clearStore } = useContext(StoreContext);
    const [isScanning, setIsScanning] = useState(false);
    const [scanType, setScanType] = useState('barcode');
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const currentUser = getUser();
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Refresh cart whenever scanning ends or store changes
    useEffect(() => {
        setCart(getCart());
    }, [isScanning, activeStore]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
             streamRef.current = null;
        }
    };

    const removeCartItem = (itemId) => {
        let currentCart = getCart();
        if (!currentCart) return;
        currentCart.items = currentCart.items.filter(i => i.id !== itemId);
        currentCart.total = currentCart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
        saveCart(currentCart);
        setCart({ ...currentCart });
    };

    const handleScan = async (decodedText) => {
        setIsScanning(false);

        // ── Store QR scan ─────────────────────────────────────────────
        if (scanType === 'store' || !activeStore) {
            setLoading(true);
            try {
                // Fetch store details from database
                const storeRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stores/${encodeURIComponent(decodedText)}`);
                let storeData;
                if (storeRes.ok) {
                    storeData = await storeRes.json();
                } else {
                    storeData = { id: decodedText, name: decodedText.replace(/_/g, ' ').toUpperCase() || 'Store' };
                }
                saveStore(storeData);
                const newCart = { store: storeData, items: [], total: 0 };
                saveCart(newCart);
                setCart(newCart);
                toast.success(`Entered ${storeData.name}`, { description: 'Now scan product barcodes' });
            } catch (err) {
                const fallbackStore = { id: decodedText, name: decodedText };
                saveStore(fallbackStore);
                saveCart({ store: fallbackStore, items: [], total: 0 });
                toast.success('Store Set', { description: 'Now scan products' });
            } finally {
                setLoading(false);
            }
            return;
        }

        // ── Product barcode scan ──────────────────────────────────────
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${decodedText}`);

            if (res.ok) {
                const product = await res.json();

                // Verify if it is from this store or not
                if (product.store_id && String(product.store_id) !== String(activeStore?.id)) {
                    toast.error('Invalid Product', { description: 'This product belongs to a different store' });
                    setLoading(false);
                    return;
                }

                let currentCart = getCart() || { store: activeStore, items: [], total: 0 };

                const existing = currentCart.items.find(i => i.barcode === decodedText || i.id === product.id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    currentCart.items.push({
                        id: product.id || decodedText,
                        name: product.name,
                        price: Number(product.price) || 0,
                        barcode: product.barcode || decodedText,
                        brand: product.company || product.brand || '',
                        category: product.type || product.category || '',
                        weight: product.weight || '',
                        mfg_date: product.mfg_date || '',
                        exp_date: product.exp_date || '',
                        quantity: 1,
                    });
                }

                currentCart.total = currentCart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                saveCart(currentCart);
                setCart({ ...currentCart });

                // Optional UI fetch call representation (if backend implements cart sync)
                if (currentUser?.id) {
                    fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: currentUser.id,
                            product_id: product.id,
                            store_id: activeStore?.store_id || activeStore?.id,
                            quantity: existing ? existing.quantity : 1,
                            action: existing ? 'update' : 'add'
                        })
                    }).catch(() => { });
                }

                toast.success(`Added "${product.name}"`, { description: `₹${product.price}` });
            } else if (res.status === 404) {
                toast.error('Product not found', { description: `Barcode: ${decodedText}` });
            } else {
                toast.error('Server error', { description: 'Could not fetch product' });
            }
        } catch (e) {
            console.error('Fetch error:', e);
            toast.error('Connection error', { description: 'Make sure the backend server is running' });
        } finally {
            setLoading(false);
        }
    };

    const cartItemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const hasItems = cartItemCount > 0;

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-28">
            <h1 className="text-3xl font-bold mb-1 mt-4">Scanner</h1>
            <p className="text-sm text-gray-400 mb-6 font-medium">
                {activeStore ? `Shopping at ${activeStore.name}` : 'Scan store QR to start'}
            </p>

            {/* ── No store selected ── */}
            {!activeStore && (
                <div className="bg-[#131722] rounded-3xl p-8 flex flex-col items-center text-center border border-gray-800/60 shadow-lg mt-2">
                    <div className="w-24 h-24 bg-[#2a2c16] rounded-3xl flex items-center justify-center mb-6">
                        <Store className="w-12 h-12 text-yellow-500 stroke-[1.5]" />
                    </div>
                    <h2 className="text-xl font-bold mb-3 text-white">Scan Store QR Code</h2>
                    <p className="text-gray-400 text-sm mb-8 px-2 font-medium">
                        Scan the QR at the store entrance to start adding products
                    </p>
                    <Button
                        onClick={() => { setScanType('store'); setIsScanning(true); }}
                        className="w-full bg-yellow-400 text-black hover:bg-yellow-500 rounded-2xl py-7 text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-yellow-400/20"
                    >
                        <ScanLine className="w-6 h-6 stroke-[2]" />
                        Scan Store QR
                    </Button>
                </div>
            )}

            {/* ── Store active ── */}
            {activeStore && (
                <div className="space-y-4">
                    {/* Store info card */}
                    <div className="bg-[#131722] rounded-3xl p-4 flex items-center justify-between border border-gray-800/60 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center">
                                <Store className="w-7 h-7 text-black stroke-[2]" />
                            </div>
                            <div className="text-left">
                                <p className="text-[13px] text-gray-400 font-medium mb-0.5">Currently shopping at</p>
                                <p className="text-white font-bold text-lg leading-tight">{activeStore.name}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-400 border border-gray-700 bg-transparent hover:text-white hover:bg-gray-800 rounded-xl flex items-center gap-2 font-medium px-3"
                            onClick={() => {
                                clearStore();
                                saveCart(null);
                                setCart(null);
                            }}
                        >
                            <RefreshCw className="w-[14px] h-[14px]" /> Change
                        </Button>
                    </div>

                    {/* Scan button */}
                    <Button
                        disabled={loading}
                        onClick={() => { setScanType('barcode'); setIsScanning(true); }}
                        className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] rounded-2xl py-7 text-lg font-bold flex items-center justify-center gap-2 shadow-md shadow-green-500/20 disabled:opacity-60"
                    >
                        <ScanLine className="w-6 h-6 stroke-[2]" />
                        {loading ? 'Looking up product…' : 'Scan Product Barcode'}
                    </Button>

                    {/* ── Mini cart ── */}
                    {hasItems ? (
                        <div className="bg-[#131722] rounded-3xl border border-gray-800/60 shadow-lg overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                                    <span className="font-bold text-base">Cart Items ({cartItemCount})</span>
                                </div>
                                <span className="text-yellow-400 font-bold text-base">₹{(cart?.total || 0).toFixed(2)}</span>
                            </div>

                            {/* Items list */}
                            <div className="px-5 space-y-0 divide-y divide-gray-800">
                                {cart.items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-3">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className="font-semibold text-sm text-white">{item.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity} × ₹{item.price}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-yellow-400 font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</span>
                                            <button
                                                onClick={() => removeCartItem(item.id)}
                                                className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center"
                                            >
                                                <X className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total + CTA */}
                            <div className="px-5 pt-3 pb-5 border-t border-gray-800 mt-1">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400 font-medium">Total</span>
                                    <span className="text-yellow-400 font-bold text-xl">₹{(cart?.total || 0).toFixed(2)}</span>
                                </div>
                                <Button
                                    onClick={() => navigate(createPageUrl('Cart'))}
                                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500 rounded-2xl py-6 text-base font-bold flex items-center justify-center gap-2"
                                >
                                    Go to Cart &amp; Pay
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="bg-[#131722] rounded-3xl p-8 flex flex-col items-center text-center border border-gray-800/60 shadow-lg min-h-[180px] justify-center">
                            <div className="w-14 h-14 bg-gray-800/60 rounded-2xl flex items-center justify-center mb-4">
                                <ShoppingBag className="w-7 h-7 text-gray-400 stroke-[1.5]" />
                            </div>
                            <p className="text-gray-300 font-medium mb-1">No items scanned yet</p>
                            <p className="text-gray-500 text-sm font-medium">Scan a product barcode to add it here</p>
                        </div>
                    )}
                </div>
            )}

            {/* Camera overlay */}
            {isScanning && (
                <BarcodeScanner
                    key={Date.now()}   // 🔥 THIS FIXES THE BLANK SCREEN
                    scanType={scanType}
                    storeName={activeStore?.name}
                    onScan={handleScan}
                    onClose={() => {
                        stopCamera();   // ✅ stop camera
                        setIsScanning(false);
                    }}
                />
            )}
        </div>
    );
}
