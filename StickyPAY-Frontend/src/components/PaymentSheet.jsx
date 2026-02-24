import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Smartphone, ChevronRight, Check, X, Lock, Eye, EyeOff, Plus, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPaymentMethods, getWallet, getPin, savePin, deductWalletBalance, getTokens } from './localData';

// ── PIN Pad ───────────────────────────────────────────────────────────
function PinPad({ title, subtitle, onSuccess, onCancel, isSetup = false }) {
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [step, setStep] = useState(isSetup ? 'set' : 'verify');
    const [error, setError] = useState('');

    const handleDigit = (d) => {
        if (step === 'set' && pin.length < 4) {
            const newPin = pin + d;
            setPin(newPin);
            if (newPin.length === 4 && isSetup) { setStep('confirm'); }
        } else if (step === 'confirm' && confirm.length < 4) {
            const newConfirm = confirm + d;
            setConfirm(newConfirm);
            if (newConfirm.length === 4) {
                if (newConfirm === pin) { savePin(newConfirm); onSuccess(newConfirm); }
                else { setError('PINs do not match'); setConfirm(''); }
            }
        } else if (step === 'verify' && pin.length < 4) {
            const newPin = pin + d;
            setPin(newPin);
            if (newPin.length === 4) {
                const stored = getPin();
                if (!stored) { setError('No PIN set. Please set a PIN first.'); setPin(''); }
                else if (stored === newPin) { onSuccess(newPin); }
                else { setError('Incorrect PIN'); setPin(''); }
            }
        }
    };

    const del = () => {
        if (step === 'confirm') setConfirm(c => c.slice(0, -1));
        else setPin(p => p.slice(0, -1));
    };

    const current = step === 'confirm' ? confirm : pin;
    const label = step === 'set' ? 'Create PIN' : step === 'confirm' ? 'Confirm PIN' : 'Enter PIN';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
            <div className="bg-gray-900 rounded-3xl p-6 w-80 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-white">{title || label}</h3>
                        {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <p className="text-center text-gray-400 text-sm mb-4">{label}</p>
                <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-4 h-4 rounded-full border-2 ${current.length > i ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600'}`} />
                    ))}
                </div>
                {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                        <button key={i} onClick={() => d === '⌫' ? del() : d !== '' && handleDigit(String(d))}
                            className={`h-14 rounded-2xl font-bold text-lg ${d === '' ? '' : 'bg-gray-800 text-white active:bg-gray-700'}`}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Wallet Pay ────────────────────────────────────────────────────────
function WalletPay({ totalAmount, onConfirm, onCancel }) {
    const [showPin, setShowPin] = useState(true);
    const wallet = getWallet();
    const hasPin = !!getPin();
    const sufficient = wallet.balance >= totalAmount;

    if (showPin) {
        return (
            <PinPad
                title="Wallet PIN"
                subtitle="Enter your security PIN to pay"
                isSetup={!hasPin}
                onSuccess={() => setShowPin(false)}
                onCancel={onCancel}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-sm">Wallet Balance</p>
                <p className={`text-3xl font-bold mt-1 ${sufficient ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{wallet.balance.toFixed(2)}
                </p>
            </div>
            {!sufficient && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    Insufficient balance. Please add funds or choose another method.
                </div>
            )}
            <Button
                onClick={() => sufficient && onConfirm('wallet')}
                className={`w-full py-5 rounded-xl font-semibold ${sufficient ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-500'}`}
            >
                Pay ₹{totalAmount.toFixed(2)} from Wallet
            </Button>
        </div>
    );
}

// ── Saved Card Detail ─────────────────────────────────────────────────
function SavedCardPay({ method, onConfirm, onCancel }) {
    const [showPin, setShowPin] = useState(true);
    const hasPin = !!getPin();

    if (showPin) {
        return (
            <PinPad
                title="Confirm Payment"
                subtitle={`${method.name} ···· ${method.last4}`}
                isSetup={!hasPin}
                onSuccess={() => setShowPin(false)}
                onCancel={onCancel}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-gray-400 text-sm">•••• •••• •••• {method.last4}</p>
                </div>
                <div className="ml-auto">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Verified</span>
                </div>
            </div>
            <Button onClick={() => onConfirm('card')} className="w-full py-5 rounded-xl font-semibold bg-yellow-400 text-black">
                Confirm Pay ₹{/* injected by parent */}
            </Button>
        </div>
    );
}

// ── Saved UPI Pay ─────────────────────────────────────────────────────
function SavedUpiPay({ method, onConfirm, onCancel }) {
    const [showPin, setShowPin] = useState(true);
    const hasPin = !!getPin();

    if (showPin) {
        return (
            <PinPad
                title="UPI Payment"
                subtitle={method.upiId}
                isSetup={!hasPin}
                onSuccess={() => setShowPin(false)}
                onCancel={onCancel}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-gray-400 text-sm">{method.upiId}</p>
                </div>
                <div className="ml-auto">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Verified</span>
                </div>
            </div>
            <Button onClick={() => onConfirm('upi')} className="w-full py-5 rounded-xl font-semibold bg-yellow-400 text-black">
                Pay via UPI
            </Button>
        </div>
    );
}

// ── Manual Card Form ──────────────────────────────────────────────────
function CardForm({ onConfirm }) {
    const [num, setNum] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [showCvv, setShowCvv] = useState(false);
    const ready = num.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3 && name.trim();
    const formatNum = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };

    return (
        <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Cardholder Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none" />
            <input value={num} onChange={e => setNum(formatNum(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none tracking-widest" />
            <div className="grid grid-cols-2 gap-3">
                <input value={expiry} onChange={e => setExpiry(formatExp(e.target.value))} placeholder="MM/YY" maxLength={5}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none" />
                <div className="relative">
                    <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="CVV" maxLength={3}
                        type={showCvv ? 'text' : 'password'}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-500 outline-none" />
                    <button onClick={() => setShowCvv(!showCvv)} className="absolute right-3 top-3.5 text-gray-500">
                        {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            <Button onClick={() => ready && onConfirm('card')} className={`w-full py-5 rounded-xl font-semibold ${ready ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-500'}`}>
                Verify & Pay
            </Button>
        </div>
    );
}

// ── Manual UPI Form ───────────────────────────────────────────────────
function UPIForm({ onConfirm }) {
    const [upiId, setUpiId] = useState('');
    const valid = /^[\w.\-]+@[\w]+$/.test(upiId);
    return (
        <div className="space-y-3">
            <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none" />
            <p className="text-gray-500 text-xs">e.g. name@okicici, name@ybl, name@paytm</p>
            {valid && <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3"><Check className="w-4 h-4" /> UPI ID verified</div>}
            <Button onClick={() => valid && onConfirm('upi')} className={`w-full py-5 rounded-xl font-semibold ${valid ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-500'}`}>
                Verify & Pay
            </Button>
        </div>
    );
}

// ── Main PaymentSheet ─────────────────────────────────────────────────
export default function PaymentSheet({ totalAmount, onPay, onClose, redeemTokens = 0 }) {
    const [selected, setSelected] = useState(null);
    const [savedMethods, setSavedMethods] = useState([]);
    const wallet = getWallet();
    const tokens = getTokens();
    const effectiveAmount = Math.max(0, totalAmount - redeemTokens);

    useEffect(() => {
        setSavedMethods(getPaymentMethods());
    }, []);

    const handlePay = (method) => {
        if (method === 'wallet') {
            const result = deductWalletBalance(effectiveAmount, 'Store payment');
            if (!result) return;
        }
        onPay(method);
    };

    const walletMethod = { id: '_wallet', type: 'wallet', name: 'StickyPAY Wallet', balance: wallet.balance };

    const renderMethodContent = () => {
        if (!selected) return null;
        if (selected === '_wallet') return <WalletPay totalAmount={effectiveAmount} onConfirm={handlePay} onCancel={() => setSelected(null)} />;
        const m = savedMethods.find(x => x.id === selected);
        if (m?.type === 'card') return (
            <div className="space-y-4">
                <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                    <div><p className="font-semibold">{m.name}</p><p className="text-gray-400 text-sm">•••• {m.last4}</p></div>
                </div>
                <Button onClick={() => onPay('card')} className="w-full py-5 rounded-xl font-semibold bg-yellow-400 text-black">
                    Pay ₹{effectiveAmount.toFixed(2)}
                </Button>
            </div>
        );
        if (m?.type === 'upi') return (
            <div className="space-y-4">
                <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                    <Smartphone className="w-6 h-6 text-purple-400" />
                    <div><p className="font-semibold">{m.name}</p><p className="text-gray-400 text-sm">{m.upiId}</p></div>
                </div>
                <Button onClick={() => onPay('upi')} className="w-full py-5 rounded-xl font-semibold bg-yellow-400 text-black">
                    Pay ₹{effectiveAmount.toFixed(2)} via UPI
                </Button>
            </div>
        );
        if (selected === '_new_card') return <CardForm onConfirm={onPay} />;
        if (selected === '_new_upi') return <UPIForm onConfirm={onPay} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
            <div className="w-full bg-gray-900 rounded-t-3xl border-t border-gray-800 max-h-[85vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold">Pay ₹{effectiveAmount.toFixed(2)}</h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    {redeemTokens > 0 && (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-400/10 rounded-xl px-3 py-2 mb-3">
                            <span>🪙</span>
                            <span>₹{redeemTokens.toFixed(2)} tokens redeemed · Original: ₹{totalAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <p className="text-gray-500 text-xs mb-4">All payments are secured with PIN verification</p>

                    {!selected ? (
                        <div className="space-y-2">
                            <p className="text-gray-400 text-sm font-medium mb-3">Saved Methods</p>

                            {/* Wallet */}
                            <button onClick={() => setSelected('_wallet')}
                                className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-sm">StickyPAY Wallet</p>
                                        <p className="text-green-400 text-xs font-semibold">₹{wallet.balance.toFixed(2)} available</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock className="w-3 h-3 text-gray-500" />
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </div>
                            </button>

                            {/* Saved Cards & UPI */}
                            {savedMethods.map(m => {
                                const Icon = m.type === 'upi' ? Smartphone : CreditCard;
                                const color = m.type === 'upi' ? 'text-purple-400 bg-purple-500/20' : 'text-blue-400 bg-blue-500/20';
                                return (
                                    <button key={m.id} onClick={() => setSelected(m.id)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm">{m.name}</p>
                                                <p className="text-gray-400 text-xs">{m.type === 'upi' ? m.upiId : `•••• ${m.last4}`}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.isDefault && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Default</span>}
                                            <Lock className="w-3 h-3 text-gray-500" />
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </button>
                                );
                            })}

                            <p className="text-gray-400 text-sm font-medium mt-4 mb-2">Add New</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setSelected('_new_card')}
                                    className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm">
                                    <Plus className="w-4 h-4" /> New Card
                                </button>
                                <button onClick={() => setSelected('_new_upi')}
                                    className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl border border-dashed border-gray-600 text-gray-400 text-sm">
                                    <Plus className="w-4 h-4" /> New UPI
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                ← Back to methods
                            </button>
                            {renderMethodContent()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}