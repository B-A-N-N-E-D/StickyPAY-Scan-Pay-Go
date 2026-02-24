import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';

export default function Layout({ children, currentPageName }) {
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const updateCartCount = () => {
            const saved = localStorage.getItem('stickyPAYCart');

            if (saved) {
                const data = JSON.parse(saved);
                const count =
                    data.items?.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                    ) || 0;

                setCartCount(count);
            } else {
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
        <div className="min-h-screen bg-black">

            {/* Top Logo */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800/50">
                <div className="flex items-center justify-center py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-green-500 flex items-center justify-center">
                            <span className="text-black font-bold text-sm">S</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">
                            Sticky<span className="text-yellow-400">PAY</span>
                        </h1>
                    </div>
                </div>
            </div>

            <style>{`
                :root {
                    --background: 0 0% 0%;
                    --foreground: 0 0% 100%;
                    --card: 0 0% 7%;
                    --card-foreground: 0 0% 100%;
                    --primary: 50 100% 50%;
                    --primary-foreground: 0 0% 0%;
                    --secondary: 142 76% 36%;
                    --secondary-foreground: 0 0% 100%;
                    --muted: 0 0% 15%;
                    --muted-foreground: 0 0% 60%;
                    --accent: 50 100% 50%;
                    --accent-foreground: 0 0% 0%;
                    --border: 0 0% 20%;
                    --input: 0 0% 15%;
                    --ring: 50 100% 50%;
                }

                body {
                    background-color: black;
                    color: white;
                }

                * {
                    scrollbar-width: thin;
                    scrollbar-color: #333 transparent;
                }

                *::-webkit-scrollbar {
                    width: 6px;
                }

                *::-webkit-scrollbar-track {
                    background: transparent;
                }

                *::-webkit-scrollbar-thumb {
                    background-color: #333;
                    border-radius: 3px;
                }
            `}</style>

            <div className="pt-14 pb-24">
                {children}
            </div>

            <BottomNav cartCount={cartCount} />
        </div>
    );
}