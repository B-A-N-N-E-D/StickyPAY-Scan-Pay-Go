import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'How do I scan a product?', a: 'Tap the scan button in the center of the bottom navigation, scan the store QR first, then scan each product barcode to add it to your cart.' },
  { q: 'How do I pay for my items?', a: 'After scanning all products, tap "Go to Cart & Pay", choose your payment method (Card, Wallet, or UPI), and tap "Pay Now".' },
  { q: 'Can I remove items from cart?', a: 'Yes! On the Cart page, you can increase/decrease item quantities or remove items entirely using the trash icon.' },
  { q: 'How do I download an invoice?', a: 'Go to History tab or Order History in Profile, expand any order, and tap "Download Invoice" to save a copy.' },
  { q: 'Is my data stored securely?', a: 'All your data is stored locally on your device. No data is sent to external servers.' },
  { q: 'How do I add a payment method?', a: 'Go to Profile → Payment Methods → tap "Add Payment Method" and fill in your card or UPI details.' },
  { q: 'What if the barcode doesn\'t scan?', a: 'Ensure good lighting and hold the camera steady. You can also use the manual entry option shown on the scanner screen.' },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!feedback.trim()) return;
    setSent(true);
    setFeedback('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>

      {/* Contact Options */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Phone, label: 'Call Us', sub: '1800-000-0000' },
            { icon: Mail, label: 'Email', sub: 'help@stickypay.app' },
            { icon: MessageCircle, label: 'Chat', sub: 'Live support' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <button
                className="w-full p-4 text-left flex items-center justify-between"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <span className="font-medium text-sm">{faq.q}</span>
                {expanded === idx ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
              </button>
              {expanded === idx && (
                <div className="px-4 pb-4 text-gray-400 text-sm border-t border-gray-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="px-6 pb-8">
        <h2 className="text-lg font-semibold mb-4">Send Feedback</h2>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <textarea
            rows={4}
            placeholder="Describe your issue or suggestion..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 border border-gray-700 outline-none resize-none text-sm"
          />
          <button
            onClick={handleSend}
            className={`mt-3 w-full py-3 rounded-xl font-semibold text-sm transition-all ${sent ? 'bg-green-500 text-black' : 'bg-yellow-400 text-black hover:bg-yellow-500'
              }`}
          >
            {sent ? '✓ Feedback Sent!' : 'Send Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}