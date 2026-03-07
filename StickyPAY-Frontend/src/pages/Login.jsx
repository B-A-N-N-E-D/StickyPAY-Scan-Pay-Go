import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { User, Phone, Mail, MapPin, ChevronRight, LogIn } from 'lucide-react';
import { saveUser, getUser } from '../components/localData';

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '' });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const existing = getUser();
        if (existing?.full_name) {
            navigate(createPageUrl('Home'));
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.phone) return;

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profiles/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (res.ok && data.user) {
                saveUser(data.user);
                navigate(createPageUrl('Home'));
            } else {
                alert(data.message || 'Error logging in');
            }
        } catch (err) {
            console.error("Login failed", err);
            alert('Unable to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col justify-center px-6 pb-20">
            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-green-500 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                        <span className="text-black font-extrabold text-3xl">S</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2">Welcome to StickyPAY</h1>
                <p className="text-gray-400 text-center text-sm mb-8">Enter your details to start scanning & paying seamlessly.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            required
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                            className="w-full bg-[#131722] border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="tel"
                            required
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="w-full bg-[#131722] border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                            placeholder="Mobile Number"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-[#131722] border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                            placeholder="Email Address (Optional)"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 pt-4 pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-500" />
                        </div>
                        <textarea
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            className="w-full bg-[#131722] border border-gray-800 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all resize-none h-24"
                            placeholder="Delivery Address (Optional)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Please wait...' : <>Continue <LogIn className="w-5 h-5" /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
