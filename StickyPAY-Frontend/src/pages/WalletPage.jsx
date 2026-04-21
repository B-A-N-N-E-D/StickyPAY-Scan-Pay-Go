import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, EyeOff, Lock, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { getWallet, addWalletBalance, getPin, savePin } from '../components/localData';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function PinPad({ title, subtitle, onSuccess, onCancel, isSetup = false }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState(isSetup ? 'set' : 'verify');
  const [error, setError] = useState('');

  const handleDigit = (d) => {
    if (step === 'set' && pin.length < 4) {
      const np = pin + d;
      setPin(np);
      if (np.length === 4 && isSetup) setStep('confirm');
    } else if (step === 'confirm' && confirm.length < 4) {
      const nc = confirm + d;
      setConfirm(nc);
      if (nc.length === 4) {
        if (nc === pin) { savePin(nc); onSuccess(nc); }
        else { setError('PINs do not match'); setConfirm(''); }
      }
    } else if (step === 'verify' && pin.length < 4) {
      const np = pin + d;
      setPin(np);
      if (np.length === 4) {
        const stored = getPin();
        if (!stored) { setError('No PIN set'); setPin(''); }
        else if (stored === np) onSuccess(np);
        else { setError('Incorrect PIN'); setPin(''); }
      }
    }
  };

  const del = () => {
    if (step === 'confirm') setConfirm(c => c.slice(0, -1));
    else setPin(p => p.slice(0, -1));
  };

  const current = step === 'confirm' ? confirm : pin;
  const label = step === 'set' ? 'Create 4-digit PIN' : step === 'confirm' ? 'Confirm PIN' : 'Enter PIN';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl p-6 w-80 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-white">{title || label}</h3>
            {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
            ✕
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
              className={`h-14 rounded-2xl font-bold text-lg ${d === '' ? '' : 'bg-white/10 backdrop-blur-md text-white active:bg-gray-700'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [action, setAction] = useState(null); // 'view' | 'add'
  const hasPin = !!getPin();

  useEffect(() => {
    document.body.classList.add("hide-bottom-nav");
    return () => document.body.classList.remove("hide-bottom-nav");
  }, []);
  
  useEffect(() => {
    setWallet(getWallet());
  }, []);

  const handleUnlock = () => {
    setAction('view');
    setShowPin(true);
  };

  const handleAddBalance = () => {
    if (!unlocked) {
      setAction('add');
      setShowPin(true);
    } else {
      setShowAdd(true);
    }
  };

  const onPinSuccess = () => {
    setShowPin(false);
    setUnlocked(true);
    if (action === 'add') setShowAdd(true);
  };

  const confirmAdd = () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) return;
    const updated = addWalletBalance(amt);
    setWallet(updated);
    setShowAdd(false);
    setAddAmount('');
  };

  const QUICK_AMOUNTS = [100, 250, 500, 1000];

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {showPin && (
        <PinPad
          title={hasPin ? 'Wallet PIN' : 'Set Wallet PIN'}
          subtitle="Secure your wallet"
          isSetup={!hasPin}
          onSuccess={onPinSuccess}
          onCancel={() => setShowPin(false)}
        />
      )}

      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">My Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-sm">StickyPAY Wallet</p>
              <p className="text-white font-bold">Available Balance</p>
            </div>
          </div>

          {unlocked ? (
            <p className="text-4xl font-bold text-white mb-1">₹{wallet?.balance?.toFixed(2) || '0.00'}</p>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <p className="text-4xl font-bold text-white">₹ ••••</p>
              <button onClick={handleUnlock} className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 text-white text-sm">
                <Eye className="w-4 h-4" /> View
              </button>
            </div>
          )}
          <p className="text-green-200 text-xs">Protected with PIN 🔒</p>

          <div className="flex gap-3 mt-5">
            <button onClick={handleAddBalance}
              className="flex-1 bg-white text-green-800 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Money
            </button>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <div className="w-full bg-gray-900 rounded-t-3xl p-6 border-t border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Add Money to Wallet</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-gray-400">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAddAmount(String(a))}
                  className={`py-2 rounded-xl text-sm font-semibold border ${addAmount === String(a) ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400' : 'border-gray-700 text-gray-300'}`}>
                  ₹{a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full bg-white/10 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 outline-none mb-4"
            />
            <Button onClick={confirmAdd} className="w-full bg-[#22c55e] text-black font-semibold py-5 rounded-xl">
              Add ₹{addAmount || '0'} to Wallet
            </Button>
          </div>
        </div>
      )}

      {/* Transactions */}
      {unlocked && wallet && (
        <div className="px-6 mt-6">
          <h3 className="font-semibold mb-3">Transaction History</h3>
          {wallet.transactions?.length === 0 && (
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
              <p className="text-gray-500 text-sm">No transactions yet</p>
            </div>
          )}
          <div className="space-y-2">
            {wallet.transactions?.map(tx => (
              <div key={tx.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-[#22c55e]/20' : 'bg-red-500/20'}`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5 text-green-400" /> : <ArrowUpRight className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.note}</p>
                    <p className="text-gray-500 text-xs">{tx.date ? format(new Date(tx.date), 'dd MMM yyyy, HH:mm') : ''}</p>
                  </div>
                </div>
                <p className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!unlocked && (
        <div className="px-6 mt-10 text-center">
          <Lock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Enter your PIN to view transaction history</p>
          <button onClick={handleUnlock} className="mt-3 text-yellow-400 text-sm font-semibold">Unlock Wallet</button>
        </div>
      )}
    </div>
  );
}