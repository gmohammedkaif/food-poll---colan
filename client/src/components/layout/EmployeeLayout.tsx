import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Home, BarChart3, Bell } from 'lucide-react';
import { clsx } from 'clsx';

export const EmployeeLayout: React.FC = () => {
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '/dashboard' || location.pathname.startsWith('/poll');
  const isResults = location.pathname === '/results' || location.pathname.includes('/results');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-700">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-16">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Bottom Mobile Navigation Bar matching Reference (Bottom-Right Panel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg px-6 py-2.5 flex items-center justify-around select-none">
        <Link
          to="/dashboard"
          className={clsx(
            'flex flex-col items-center gap-1 text-[11px] font-bold transition-colors',
            isHome ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          )}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/results"
          className={clsx(
            'flex flex-col items-center gap-1 text-[11px] font-bold transition-colors',
            isResults ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Results</span>
        </Link>
      </div>
    </div>
  );
};
