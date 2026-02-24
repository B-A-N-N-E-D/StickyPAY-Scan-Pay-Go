import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { Home, ScanLine, User, ShoppingCart, History } from 'lucide-react';
import { motion } from 'framer-motion';

const leftItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'History', icon: History, page: 'History' },
];

const rightItems = [
    { name: 'Cart', icon: ShoppingCart, page: 'Cart' },
    { name: 'Profile', icon: User, page: 'Profile' },
];

export default function BottomNav({ cartCount = 0 }) {
    const location = useLocation();
    const currentPath = location.pathname.substring(1) || 'Home';

    const NavItem = ({ item }) => {
        const isActive = currentPath.toLowerCase() === item.page.toLowerCase();
        const Icon = item.icon;

        return (
            <Link to={createPageUrl(item.page)}>
                <motion.div
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center p-2 rounded-xl relative ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}
                >
                    <div className={`relative p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-yellow-400/20' : ''}`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                        {item.name === 'Cart' && cartCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-black text-xs font-bold rounded-full flex items-center justify-center"
                            >
                                {cartCount}
                            </motion.span>
                        )}
                    </div>
                    <span className={`text-xs mt-1 transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>
                        {item.name}
                    </span>
                    {isActive && (
                        <motion.div
                            layoutId="nav-indicator"
                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-yellow-400 rounded-full"
                        />
                    )}
                </motion.div>
            </Link>
        );
    };

    const isScannerActive = currentPath.toLowerCase() === 'scanner';

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 px-4 py-2 z-40">
            <div className="flex justify-between items-end max-w-md mx-auto relative">
                {/* Left Items */}
                <div className="flex gap-4">
                    {leftItems.map((item) => (
                        <NavItem key={item.name} item={item} />
                    ))}
                </div>

                {/* Center Scanner Button - Popped Up */}
                <Link to={createPageUrl('Scanner')} className="absolute left-1/2 -translate-x-1/2 -top-6">
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.92 }}>
                        <div className="relative p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-green-500 shadow-lg shadow-yellow-400/30">
                            <ScanLine className="w-7 h-7 text-black stroke-[2.5]" />
                        </div>
                        <span className={`block text-center text-xs mt-2 ${isScannerActive ? 'text-yellow-400 font-semibold' : 'text-gray-500'}`}>
                            Scan
                        </span>
                    </motion.div>
                </Link>

                {/* Right Items */}
                <div className="flex gap-4">
                    {rightItems.map((item) => (
                        <NavItem key={item.name} item={item} />
                    ))}
                </div>
            </div>
        </nav>
    );
}