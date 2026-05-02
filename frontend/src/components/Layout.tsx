import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, ShoppingBag, ShoppingCart, Package, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: ShoppingBag,     label: 'Flash Sale' },
  { to: '/orders',    icon: Package,          label: 'My Orders' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SideNav = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="bg-orange-500 p-1.5 rounded-lg">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">FlashSale</p>
          <p className="text-gray-500 text-xs">High-Concurrency API</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
          <p className="text-gray-500 text-xs">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 flex-shrink-0">
        <SideNav />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-gray-900 border-r border-gray-800 z-10">
            <SideNav />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-orange-500" />
            <span className="font-bold text-sm">FlashSale</span>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
