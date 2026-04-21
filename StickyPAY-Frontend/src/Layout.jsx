import React, { useState, useEffect } from 'react';
import { User, Sun, Moon } from "lucide-react";
import BottomNav from './components/BottomNav';
import { useTheme } from './context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from './lib/utils';

export default function Layout({ children, currentPageName }) {
    const [cartCount, setCartCount] = useState(0);
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const updateCartCount = () => {
            try {
                const saved = localStorage.getItem('stickyPayCart');

                if (!saved) {
                    setCartCount(0);
                    return;
                }

                const data = JSON.parse(saved);

                if (!data || !Array.isArray(data.items)) {
                    setCartCount(0);
                    return;
                }

                const count = data.items.reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0
                );

                setCartCount(count);
            } catch (error) {
                console.error("Cart parse error:", error);
                setCartCount(0);
            }
        };

        updateCartCount();

        window.addEventListener('storage', updateCartCount);
        const interval = setInterval(updateCartCount, 1000);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="app-wrapper">

            {/* ── Top Navbar ── */}
            <div className="fixed top-0 left-0 right-0 z-50 glass-nav-top">

                <div className="flex items-center justify-between px-6 py-4">

                    {/* LEFT — LOGO */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-green-500 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                            <span className="text-black font-bold text-sm">S</span>
                        </div>
                        <h1
                            className="text-lg font-semibold tracking-wide"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Sticky<span style={{ color: 'var(--text-logo-accent)' }}>PAY</span>
                        </h1>
                    </div>

                    {/* RIGHT — THEME TOGGLE + BELL */}
                    <div className="flex items-center gap-3">

                        {/* Day / Night Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle-btn"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={isDark ? 'Light mode' : 'Dark mode'}
                        >
                            {isDark ? (
                                <Sun
                                    key="sun"
                                    className="w-[18px] h-[18px] icon-enter"
                                    strokeWidth={2}
                                />
                            ) : (
                                <Moon
                                    key="moon"
                                    className="w-[18px] h-[18px] icon-enter"
                                    strokeWidth={2}
                                />
                            )}
                        </button>

                        <button
                            className="theme-toggle-btn"
                            aria-label="Profile"
                            onClick={() => navigate(createPageUrl('Profile'))}
                        >
                            <User className="w-[18px] h-[18px]" strokeWidth={2} />
                        </button>

                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className={`pt-24 w-full min-h-screen ${currentPageName !== "Login" ? "pb-28" : ""}`}>
                {children}
            </div>

            {/* ── Bottom Nav ── */}
            {!["Login", "Wallet", "Payment"].includes(currentPageName) && (
                <BottomNav cartCount={cartCount} />
            )}
        </div>
    );
}