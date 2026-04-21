import React, { useState } from 'react';
import { savePin, getPin } from './localData';

export default function PinPad({ title, onSuccess, onCancel, isSetup }) {
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [step, setStep] = useState(isSetup ? 'set' : 'verify');
    const [error, setError] = useState('');

    const handleDigit = (d) => {
        if (step === 'set' && pin.length < 4) {
            const np = pin + d; setPin(np);
            if (np.length === 4) setStep('confirm');
        } else if (step === 'confirm' && confirm.length < 4) {
            const nc = confirm + d; setConfirm(nc);
            if (nc.length === 4) {
                if (nc === pin) { savePin(nc); onSuccess(); }
                else { setError('PINs do not match'); setConfirm(''); }
            }
        } else if (step === 'verify' && pin.length < 4) {
            const np = pin + d; setPin(np);
            if (np.length === 4) {
                if (getPin() === np) onSuccess();
                else { setError('Incorrect PIN'); setPin(''); }
            }
        }
    };

    const del = () => step === 'confirm' ? setConfirm(c => c.slice(0, -1)) : setPin(p => p.slice(0, -1));
    const current = step === 'confirm' ? confirm : pin;
    const label = step === 'set' ? 'Create 4-digit PIN' : step === 'confirm' ? 'Confirm PIN' : 'Enter Security PIN';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pin-overlay">
            <div className="pin-card rounded-3xl p-6 w-80 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold pin-title text-lg">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 rounded-full pin-close-btn flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <p className="text-center pin-label text-sm mb-6">{label}</p>
                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                current.length > i
                                    ? 'bg-yellow-400 border-yellow-400 scale-110'
                                    : 'pin-dot-empty'
                            }`}
                        />
                    ))}
                </div>
                {error && <p className="text-red-500 text-xs text-center mb-4 mt-[-1rem] font-medium">{error}</p>}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                        <button
                            key={i}
                            onClick={() => d === '⌫' ? del() : d !== '' && handleDigit(String(d))}
                            className={`h-14 rounded-2xl font-bold text-xl transition-colors pin-key ${
                                d === '' ? 'cursor-default opacity-0 pointer-events-none' : ''
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
