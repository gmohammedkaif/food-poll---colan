import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { usePushNotifications } from '../../context/PushNotificationContext.js';
import {
  UtensilsCrossed,
  BarChart3,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Vote,
  PlusCircle,
  Users,
  Utensils,
  ShieldAlert,
  Settings,
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BrandLogo } from '../ui/BrandLogo.js';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: pushLoading,
    enableNotifications,
    disableNotifications
  } = usePushNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Home' },
    { to: '/results', label: 'View Results' },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'E';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Employee';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6 lg:gap-10">
            <BrandLogo
              size="md"
              showText
              linkTo="/dashboard"
            />

            {/* Desktop Navigation Tabs matching Reference */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive =
                  location.pathname === link.to ||
                  (link.to === '/dashboard' && (location.pathname === '/' || location.pathname.startsWith('/poll')) && !location.pathname.includes('/results')) ||
                  (link.to === '/results' && location.pathname.includes('/results'));

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={clsx(
                      'relative py-5 text-sm font-bold transition-colors font-display',
                      isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls: Notification + User Avatar */}
          <div className="flex items-center gap-3">
            {/* Notification Bell & Push Settings Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
                title="Food Poll Notifications"
              >
                <Bell className="w-4 h-4" />
                {isSubscribed && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifPopoverOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-fade-in space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 font-display">
                        Food Poll Notifications
                      </span>
                    </div>
                    {isSubscribed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Off
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive immediate desktop/mobile push alerts when today's lunch poll is published, even when your browser tab is closed.
                  </p>

                  {/* Status Banner / Actions */}
                  {!isSupported ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-tight">
                      Push notifications are not supported in this browser environment.
                    </div>
                  ) : permission === 'denied' ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Notifications Blocked</span>
                      </div>
                      <p className="text-[10px] text-rose-700">
                        Browser notifications are currently blocked. Please click the padlock icon in your URL bar to enable permissions.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-1">
                      {isSubscribed ? (
                        <button
                          type="button"
                          disabled={pushLoading}
                          onClick={() => disableNotifications()}
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
                        >
                          <BellOff className="w-3.5 h-3.5" />
                          <span>Turn Off Push Notifications</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pushLoading}
                          onClick={() => enableNotifications()}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>{pushLoading ? 'Enabling...' : 'Enable Push Notifications'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
              >
                {/* Circular Avatar with Initial */}
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                    {firstName}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    {isAdmin ? 'Admin' : 'Employee'}
                  </span>
                </div>
                <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block', dropdownOpen && 'rotate-180')} />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user?.employeeId}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                      <span>Today's Lunch Poll</span>
                    </Link>
                    <Link
                      to="/results"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <span>View Results</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
