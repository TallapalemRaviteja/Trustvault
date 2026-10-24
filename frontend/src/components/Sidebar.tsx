import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  FileCheck2,
  ShieldAlert,
  History,
  Lock,
  Eye,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const links = [];

  if (user.role === 'admin') {
    links.push({
      to: '/admin',
      label: 'Security Center',
      icon: ShieldAlert,
    });
    links.push({
      to: '/documents',
      label: 'Document Library',
      icon: Files,
    });
    links.push({
      to: '/audit',
      label: 'Audit Explorer',
      icon: History,
    });
  } else if (user.role === 'owner') {
    links.push({
      to: '/dashboard',
      label: 'Owner Dashboard',
      icon: LayoutDashboard,
    });
    links.push({
      to: '/documents',
      label: 'Document Library',
      icon: Files,
    });
    links.push({
      to: '/upload',
      label: 'Upload Document',
      icon: UploadCloud,
    });
    links.push({
      to: '/audit',
      label: 'Audit Activity',
      icon: History,
    });
  } else {
    // Viewer
    links.push({
      to: '/viewer',
      label: 'Shared Documents',
      icon: Eye,
    });
    links.push({
      to: '/documents',
      label: 'Document Library',
      icon: Files,
    });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-vault-600/20 text-vault-400 border border-vault-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Security Status Box */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tamper-Evident Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            SHA-256 hash-chaining enforces append-only immutability.
          </p>
        </div>
      </div>
    </aside>
  );
};
