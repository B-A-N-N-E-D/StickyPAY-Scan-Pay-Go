import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from "../lib/utils";
import { Home, ScanLine, User, ShoppingCart, History } from 'lucide-react';

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
      <Link
        to={createPageUrl(item.page)}
        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative group ${
          isActive
            ? 'text-yellow-400'
            : 'text-gray-500 hover:text-white'
        }`}
      >
        <div
          className={`relative p-2 rounded-xl transition-all duration-300 ${
            isActive
              ? 'bg-yellow-400/20'
              : 'group-hover:bg-gray-800 group-hover:scale-110'
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-all duration-300 ${
              isActive ? 'stroke-[2.5]' : 'group-hover:stroke-[2]'
            }`}
          />

          {item.name === 'Cart' && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </div>

        <span
          className={`text-xs mt-1 transition-all duration-300 ${
            isActive ? 'font-semibold' : 'group-hover:font-medium'
          }`}
        >
          {item.name}
        </span>

        {isActive && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-yellow-400 rounded-full" />
        )}
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

        {/* Center Scanner Button */}
        <Link
          to={createPageUrl('Scanner')}
          className="absolute left-1/2 -translate-x-1/2 -top-6 group"
        >
          <div
            className={`relative p-4 rounded-2xl transition-all duration-300 shadow-lg ${
              isScannerActive
                ? 'bg-gradient-to-br from-yellow-400 to-green-500 shadow-yellow-400/30'
                : 'bg-gradient-to-br from-yellow-400 to-green-500 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-yellow-400/50'
            }`}
          >
            <ScanLine
              className={`w-7 h-7 text-black transition-all duration-300 ${
                isScannerActive ? 'stroke-[2.5]' : 'group-hover:stroke-[2.5]'
              }`}
            />

            {/* Ping Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400 to-green-500 animate-ping opacity-20"></div>
          </div>

          <span
            className={`block text-center text-xs mt-2 transition-all duration-300 ${
              isScannerActive
                ? 'text-yellow-400 font-semibold'
                : 'text-gray-500 group-hover:text-white group-hover:font-medium'
            }`}
          >
            Scan
          </span>
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