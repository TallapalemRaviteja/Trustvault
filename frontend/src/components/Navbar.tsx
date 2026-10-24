import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TrustVaultLogo } from './TrustVaultLogo';
import { auditApi } from '../api/audit';
import { AuditEvent } from '../types';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Sliders,
  Shield,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Plus,
  Upload,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<AuditEvent[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    auditApi.explorer({ page_size: 5 }).then((res) => setRecentAlerts(res.items)).catch(() => null);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return 'Security Admin';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/viewer')) return 'Shared With Me';
    if (path.startsWith('/documents/') && path !== '/documents') return 'Asset Details';
    if (path.startsWith('/documents')) return 'Drive';
    if (path.startsWith('/permissions')) return 'Access Control';
    if (path.startsWith('/upload')) return 'New Upload';
    if (path.startsWith('/audit')) return 'Audit Trail';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const breadcrumb = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E2C48] transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#162137] transition-colors md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Breadcrumb / Title Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {breadcrumb}
            </span>
          </div>
        </div>

        {/* Center/Right: Search Bar with shortcut indicator */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-12 py-1.5 bg-slate-50 dark:bg-[#121A2B] border border-slate-200 dark:border-[#1E2C48] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-[#162137] border border-slate-200 dark:border-[#1E2C48] rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>

        {/* Quick Action Icons: Outline Upload, Theme, Notifications, Settings, User */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Outline Upload Button */}
          <Link
            to="/upload"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs font-semibold transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#162137] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#162137] transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1020]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121A2B] border border-slate-200 dark:border-[#1E2C48] rounded-2xl shadow-soft-lg p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2C48]">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Recent Activity & Alerts
                  </span>
                  <Link
                    to="/audit"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    View All <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                  {recentAlerts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No recent notifications.
                    </div>
                  ) : (
                    recentAlerts.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-[#1E2C48] text-xs flex items-start gap-2.5 bg-slate-50/60 dark:bg-[#0B1020]/60"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            ev.outcome === 'DENIED' ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {ev.action}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(ev.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {ev.actor_email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Quick Icon */}
          <Link
            to="/settings"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#162137] transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </Link>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#162137] border border-transparent hover:border-slate-200 dark:hover:border-[#1E2C48] transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-white hidden lg:inline max-w-[120px] truncate">
                {user.full_name}
              </span>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#121A2B] border border-slate-200 dark:border-[#1E2C48] rounded-2xl shadow-soft-lg p-2 z-50 animate-in fade-in">
                <div className="p-3 border-b border-slate-100 dark:border-[#1E2C48]">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {user.email}
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase">
                    {user.role} Plan
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162137] rounded-xl transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Workspace Settings</span>
                  </Link>

                  <Link
                    to="/audit"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162137] rounded-xl transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>Audit Ledger</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-[#1E2C48]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
