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
  User as UserIcon,
  ChevronRight,
  Shield,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Sliders,
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

  // Fetch recent notifications / alerts
  useEffect(() => {
    if (!user) return;
    const fetchRecentAlerts = async () => {
      try {
        const res = await auditApi.explorer({ page_size: 5 });
        setRecentAlerts(res.items);
      } catch (e) {
        // quiet fallback
      }
    };
    fetchRecentAlerts();
  }, [user]);

  // Click outside listener for dropdowns
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

  // Handle global search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Generate dynamic breadcrumbs from current path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return ['Security Center', 'Administrator Overview'];
    if (path.startsWith('/dashboard')) return ['Workspace', 'Document Owner'];
    if (path.startsWith('/viewer')) return ['Workspace', 'Shared With Me'];
    if (path.startsWith('/documents/') && path !== '/documents') return ['Documents', 'Asset Details'];
    if (path.startsWith('/documents')) return ['Workspace', 'Document Library'];
    if (path.startsWith('/permissions')) return ['Access Control', 'Permission Matrix'];
    if (path.startsWith('/upload')) return ['Documents', 'Secure Upload'];
    if (path.startsWith('/audit')) return ['Compliance', 'Audit Trail Explorer'];
    if (path.startsWith('/settings')) return ['System', 'Security Settings'];
    return ['TrustVault', 'Overview'];
  };

  const breadcrumbs = getBreadcrumbs();

  const roleStyles = {
    admin: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    owner: 'bg-[#4F8CFF]/15 text-[#42D9E8] border-[#4F8CFF]/30',
    viewer: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }[user.role] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  const roleLabel = {
    admin: 'Security Admin',
    owner: 'Document Owner',
    viewer: 'Authorized Viewer',
  }[user.role] || user.role;

  return (
    <header className="sticky top-0 z-40 bg-[#0B1020]/90 dark:bg-[#0B1020]/90 light:bg-white/90 backdrop-blur-md border-b border-[#1E2C48] light:border-slate-200 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand / Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[#9BA8BD] hover:text-white hover:bg-[#162137] light:hover:bg-slate-100 transition-colors md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <TrustVaultLogo size="sm" showText={false} />
            <span className="font-extrabold text-base tracking-tight hidden sm:inline-block">
              TRUST<span className="text-[#42D9E8]">VAULT</span>
            </span>
          </Link>

          {/* Breadcrumb Navigation */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#9BA8BD] border-l border-[#1E2C48] light:border-slate-200 pl-4">
            <span>{breadcrumbs[0]}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9BA8BD]/60" />
            <span className="text-[#F4F7FC] light:text-slate-900 font-medium truncate max-w-[200px]">
              {breadcrumbs[1]}
            </span>
          </div>
        </div>

        {/* Center: Global Document Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, tag, or owner..."
              className="w-full pl-9 pr-12 py-1.5 bg-[#121A2B] light:bg-slate-100 border border-[#1E2C48] light:border-slate-300 rounded-xl text-xs text-[#F4F7FC] light:text-slate-900 placeholder-[#9BA8BD]/70 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#9BA8BD] bg-[#162137] light:bg-slate-200 border border-[#1E2C48] light:border-slate-300 rounded">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>

        {/* Right: Actions, Theme, Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#9BA8BD] hover:text-[#42D9E8] hover:bg-[#162137] light:hover:bg-slate-100 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#4F8CFF]" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-[#9BA8BD] hover:text-white hover:bg-[#162137] light:hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Security Alerts & Audit Activity"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#42D9E8] ring-2 ring-[#0B1020]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121A2B] light:bg-white border border-[#1E2C48] light:border-slate-200 rounded-2xl shadow-cyber-lg p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48] light:border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#4F8CFF]" />
                    <span className="text-xs font-bold text-[#F4F7FC] light:text-slate-900">
                      Recent Security Events
                    </span>
                  </div>
                  <Link
                    to="/audit"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-[#42D9E8] hover:underline flex items-center gap-1"
                  >
                    View All <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                  {recentAlerts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#9BA8BD]">
                      No recent security alerts recorded.
                    </div>
                  ) : (
                    recentAlerts.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                          ev.outcome === 'DENIED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-[#162137] light:bg-slate-50 border-[#1E2C48] light:border-slate-200 text-[#F4F7FC] light:text-slate-800'
                        }`}
                      >
                        <div className="mt-0.5">
                          {ev.outcome === 'DENIED' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-400 block" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate">{ev.action}</span>
                            <span className="text-[10px] text-[#9BA8BD] shrink-0 font-mono">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9BA8BD] truncate mt-0.5">
                            Actor: {ev.actor_email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-[#121A2B] light:bg-slate-100 border border-[#1E2C48] light:border-slate-200 hover:border-[#4F8CFF]/50 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#4F8CFF] to-[#42D9E8] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#F4F7FC] light:text-slate-900 leading-none truncate max-w-[120px]">
                  {user.full_name}
                </span>
                <span className="text-[10px] text-[#9BA8BD] font-mono leading-none mt-1">
                  {roleLabel}
                </span>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#121A2B] light:bg-white border border-[#1E2C48] light:border-slate-200 rounded-2xl shadow-cyber-lg p-2 z-50 animate-in fade-in">
                {/* Header in dropdown */}
                <div className="p-3 border-b border-[#1E2C48] light:border-slate-200">
                  <div className="text-xs font-semibold text-[#F4F7FC] light:text-slate-900">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-[#9BA8BD] font-mono truncate mt-0.5">
                    {user.email}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${roleStyles}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#9BA8BD] hover:text-white light:hover:text-slate-900 hover:bg-[#162137] light:hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Security & Account Settings</span>
                  </Link>

                  <Link
                    to="/audit"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#9BA8BD] hover:text-white light:hover:text-slate-900 hover:bg-[#162137] light:hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Audit Trail Log</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#1E2C48] light:border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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
