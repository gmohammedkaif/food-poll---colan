import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  LayoutDashboard,
  Vote,
  PlusCircle,
  Utensils,
  UtensilsCrossed,
  ShieldAlert,
  Settings,
  X,
  LogOut,
  History,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BrandLogo } from '../ui/BrandLogo.js';

interface AdminSidebarProps {
  onItemClick?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onItemClick,
  isMobileOpen,
  onMobileClose,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const primaryLinks = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/polls',
      end: true,
      label: 'Polls',
      icon: Vote,
    },
    {
      to: '/admin/polls/create',
      end: false,
      label: 'Create Poll',
      icon: PlusCircle,
    },
    {
      to: '/admin/employees',
      end: false,
      label: 'Employees',
      icon: Users,
    },
    {
      to: '/admin/foods',
      end: false,
      label: 'Food Catalog',
      icon: Utensils,
    },
    {
      to: '/admin/security',
      end: false,
      label: 'Audit & Security',
      icon: ShieldAlert,
    },
    {
      to: '/admin/settings',
      end: false,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full min-h-0 select-none bg-[#0B132B] text-white">
      {/* Top Brand Bar */}
      <div className="py-4 px-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <Link to="/admin" className="flex flex-col select-none group">
          <BrandLogo
            size="sm"
            showText
            darkVariant={true}
          />
          <div className="flex items-center gap-1.5 mt-1 pl-9 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Admin Portal</span>
          </div>
        </Link>

        {isMobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors lg:hidden shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
        {primaryLinks.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onItemClick}
              className={({ isActive: navActive }) => {
                const active = item.end ? navActive : isActive;
                return clsx(
                  'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                );
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-[#070C18]/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            A
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate leading-tight">
              {user?.name || 'Admin'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate leading-tight">
              Super Admin
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors shrink-0"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 border-r border-white/[0.08]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-slide-right">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};
