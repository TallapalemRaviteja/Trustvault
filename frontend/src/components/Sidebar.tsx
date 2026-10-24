import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustVaultLogo } from './TrustVaultLogo';
import {
  LayoutDashboard,
  Files,
  Share2,
  FileKey2,
  History,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UploadCloud,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Build navigation items based on role
  const mainNav = [];

  // 1. Overview
  if (user.role === 'admin') {
    mainNav.push({
      to: '/admin',
      label: 'Overview',
      icon: ShieldAlert,
      badge: 'Admin',
    });
  } else if (user.role === 'owner') {
    mainNav.push({
      to: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    });
  } else {
    mainNav.push({
      to: '/viewer',
      label: 'Overview',
      icon: LayoutDashboard,
    });
  }

  // 2. My Documents
  mainNav.push({
    to: '/documents',
    label: 'My Documents',
    icon: Files,
  });

  // 3. Shared With Me
  mainNav.push({
    to: user.role === 'viewer' ? '/viewer' : '/documents?filter=shared',
    label: 'Shared With Me',
    icon: Share2,
  });

  // 4. Access Permissions (Signature Feature)
  if (user.role === 'owner' || user.role === 'admin') {
    mainNav.push({
      to: '/permissions',
      label: 'Access Permissions',
      icon: FileKey2,
      badge: 'Signature',
    });
  }

  // 5. Upload Action
  if (user.role === 'owner' || user.role === 'admin') {
    mainNav.push({
      to: '/upload',
      label: 'Upload Document',
      icon: UploadCloud,
    });
  }

  // 6. Audit Trail
  mainNav.push({
    to: '/audit',
    label: 'Audit Trail',
    icon: History,
  });

  // 7. Settings
  mainNav.push({
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  });

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Brand */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-[#1E2C48] light:border-slate-200">
          <TrustVaultLogo size="sm" showText={!isCollapsed} />
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-[#9BA8BD] hover:text-white hover:bg-[#162137] light:hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          {!isCollapsed && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9BA8BD] px-3 mb-2 font-semibold">
              Platform Matrix
            </div>
          )}

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#4F8CFF]/20 to-[#42D9E8]/10 text-white border border-[#4F8CFF]/40 shadow-cyber-sm'
                        : 'text-[#9BA8BD] hover:text-[#F4F7FC] light:hover:text-slate-900 hover:bg-[#162137] light:hover:bg-slate-100'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4F8CFF]/20 text-[#42D9E8] border border-[#4F8CFF]/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom: Security Status & User Card */}
      <div className="p-3 border-t border-[#1E2C48] light:border-slate-200 space-y-3">
        {/* Compact Security Integrity Box */}
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#121A2B] to-[#0B1020] border border-[#1E2C48] light:border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-white light:text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Ledger</span>
            </div>
            <p className="text-[10px] text-[#9BA8BD] mt-1 leading-snug">
              Append-only tamper-evident hash chain actively guarding access.
            </p>
          </div>
        )}

        {/* User Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#121A2B] light:bg-slate-50 border border-[#1E2C48] light:border-slate-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F8CFF] to-[#42D9E8] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#F4F7FC] light:text-slate-900 truncate">
                {user.full_name}
              </div>
              <div className="text-[10px] text-[#42D9E8] font-mono uppercase tracking-wider">
                {user.role}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-[#0B1020] light:bg-white border-r border-[#1E2C48] light:border-slate-200 transition-all duration-300 min-h-[calc(100vh-4rem)] ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0B1020] light:bg-white border-r border-[#1E2C48] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
