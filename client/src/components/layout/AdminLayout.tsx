import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Menu,
  ChevronDown,
  Shield,
  LogOut,
  Settings,
  Bell,
  UtensilsCrossed,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BrandLogo } from '../ui/BrandLogo.js';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] text-slate-900 overflow-x-hidden selection:bg-blue-600/10 selection:text-blue-700">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onItemClick={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo size="sm" showText linkTo="/admin" />

          <div className="w-9" />
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
