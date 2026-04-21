import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Plus, Trash2, Star, Lock, Eye } from 'lucide-react';
import { getPaymentMethods, savePaymentMethods, getPin } from '../components/localData';
import { Button } from '@/components/ui/button';
import PinPad from '../components/PinPad';

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMethod, setNewMethod] = useState({ type: 'card', name: '', last4: '', upiId: '' });
  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pinAction, setPinAction] = useState('unlock'); // unlock or delete
  const hasPin = !!getPin();

  useEffect(() => { setMethods(getPaymentMethods()); }, []);

  const save = (updated) => {
    setMethods(updated);
    savePaymentMethods(updated);
  };

  const setDefault = (id) => {
    save(methods.map(m => ({ ...m, isDefault: m.id === id })));
  };

  const remove = (id) => {
    if (!unlocked) {
      setPinAction('delete');
      setPendingDelete(id);
      setShowPin(true);
      return;
    }
    save(methods.filter(m => m.id !== id));
  };

  const addMethod = () => {
    if (!newMethod.name) return;
    const method = {
      id: Date.now().toString(),
      ...newMethod,
      type: newMethod.type || 'card',
      isDefault: methods.length === 0,
    };
    save([...methods, method]);
    setShowAdd(false);
    setNewMethod({ type: 'card', name: '', last4: '', upiId: '' });
  };

  const Icon = (type) => {
    if (type === 'upi') return Smartphone;
    if (type === 'virtual') return CreditCard;
    return CreditCard;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {showPin && (
        <PinPad
          title={hasPin ? 'Enter Security PIN' : 'Set Security PIN'}
          isSetup={!hasPin}
          onSuccess={() => {
            setUnlocked(true);
            setShowPin(false);
            if (pinAction === 'delete' && pendingDelete) {
              save(methods.filter(m => m.id !== pendingDelete));
              setPendingDelete(null);
            }
          }}
          onCancel={() => {
            setShowPin(false);
            setPendingDelete(null);
            setPinAction('unlock');
          }}
        />
      )}

      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        {!unlocked && (
          <button onClick={() => setShowPin(true)} className="ml-auto flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-3 py-1.5 rounded-xl text-sm">
            <Eye className="w-4 h-4" /> View Details
          </button>
        )}
      </div>

      {!unlocked && (
        <div className="px-6 mb-4">
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 flex items-center gap-3">
            <Lock className="w-5 h-5 text-yellow-400" />
            <p className="text-gray-400 text-sm">Card & UPI details are hidden. Tap "View Details" to unlock.</p>
          </div>
        </div>
      )}

      <div className="px-6 space-y-3 pb-6">
        {methods.map((m) => {
          const Ic = Icon(m.type);
          return (
            <div key={m.id} className={`bg-gray-900 rounded-2xl p-4 border ${m.isDefault ? 'border-yellow-400/50' : 'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Ic className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {m.type === 'virtual' ? '💳 Virtual Card' : m.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {m.type === 'upi'
                        ? (unlocked ? m.upiId : '•••• @••••')
                        : m.type === 'virtual'
                          ? (unlocked ? `Virtual Card •••• ${m.last4}` : '•••• •••• •••• ••••')
                          : (unlocked ? (m.last4 ? `•••• •••• •••• ${m.last4}` : m.type) : '•••• •••• •••• ••••')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.isDefault ? (
                    <span className="bg-yellow-400/20 text-yellow-400 text-xs px-2 py-1 rounded-full font-semibold">Default</span>
                  ) : (
                    <button onClick={() => setDefault(m.id)} className="text-gray-500 hover:text-yellow-400 transition-colors">
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => remove(m.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {methods.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-10 border border-gray-800 text-center">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No payment methods saved</p>
          </div>
        )}

        {!showAdd ? (
          <button
            onClick={() => unlocked ? setShowAdd(true) : setShowPin(true)}
            className="w-full p-4 border-2 border-dashed border-gray-700 rounded-2xl text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Payment Method
          </button>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
            <h3 className="font-semibold">Add New Method</h3>
            <div className="flex gap-2">
              {['card', 'upi'].map(t => (
                <button
                  key={t}
                  onClick={() => setNewMethod(p => ({ ...p, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${newMethod.type === t ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' : 'border-gray-700 text-gray-400'}`}
                >
                  {t === 'card' ? 'Card' : 'UPI'}
                </button>
              ))}
            </div>
            <input
              placeholder={newMethod.type === 'card' ? 'Card name (e.g. HDFC Credit)' : 'UPI App name'}
              value={newMethod.name}
              onChange={e => setNewMethod(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700 outline-none"
            />
            {newMethod.type === 'card' ? (
              <input
                placeholder="Last 4 digits"
                value={newMethod.last4}
                onChange={e => setNewMethod(p => ({ ...p, last4: e.target.value.slice(0, 4) }))}
                className="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700 outline-none"
                maxLength={4}
              />
            ) : (
              <input
                placeholder="UPI ID (e.g. name@upi)"
                value={newMethod.upiId}
                onChange={e => setNewMethod(p => ({ ...p, upiId: e.target.value }))}
                className="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700 outline-none"
              />
            )}
            <div className="flex gap-3">
              <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1 border-gray-700 text-gray-400">Cancel</Button>
              <Button onClick={addMethod} className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500">Add</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}