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
        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative group`}
        style={{ color: isActive ? 'var(--nav-icon-active)' : 'var(--nav-icon)' }}
      >
        <div
          className={`relative p-2 rounded-xl transition-all duration-300 ${
            isActive
              ? 'shadow-[0_0_15px_rgba(250,204,21,0.35)]'
              : 'group-hover:scale-110'
          }`}
          style={{
            background: isActive
              ? 'rgba(250, 204, 21, 0.18)'
              : 'transparent',
          }}
        >
          <Icon
            className={`w-5 h-5 transition-all duration-300 ${
              isActive ? 'stroke-[2.5]' : 'group-hover:stroke-[2]'
            }`}
          />

          {item.name === 'Cart' && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#22c55e] text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </div>

        <span
          className={`text-xs mt-1 transition-all duration-300 ${
            isActive ? 'font-semibold' : 'group-hover:font-medium'
          }`}
          style={{ color: isActive ? 'var(--nav-icon-active)' : 'var(--nav-icon)' }}
        >
          {item.name}
        </span>

        {isActive && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-yellow-400 rounded-full blur-sm" />
        )}
      </Link>
    );
  };

  const isScannerActive = currentPath.toLowerCase() === 'scanner';

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div
        className="flex justify-between items-end max-w-md mx-auto relative glass-nav-bottom px-6 py-3"
      >

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
            className={`relative p-4 rounded-2xl transition-all duration-300 shadow-xl backdrop-blur-md ${
              isScannerActive
                ? 'bg-gradient-to-br from-yellow-400 to-green-500 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
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
              isScannerActive ? 'font-semibold' : 'group-hover:font-medium'
            }`}
            style={{
              color: isScannerActive ? 'var(--nav-icon-active)' : 'var(--nav-icon)',
            }}
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