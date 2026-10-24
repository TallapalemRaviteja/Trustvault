import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleColor = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    owner: 'bg-blue-100 text-blue-800 border-blue-200',
    viewer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[user.role] || 'bg-slate-100 text-slate-800';

  const roleLabel = {
    admin: 'Security Admin',
    owner: 'Document Owner',
    viewer: 'Authorized Viewer',
  }[user.role] || user.role;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Branding */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-vault-500 to-vault-700 flex items-center justify-center shadow-lg shadow-vault-900/50 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                TRUST<span className="text-vault-400">VAULT</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-mono tracking-wider -mt-1">
                SECURE DOCUMENT MATRIX
              </span>
            </div>
          </Link>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 border-r border-slate-800 pr-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-200 leading-tight">
                {user.full_name}
              </div>
              <div className="text-xs text-slate-400 font-mono leading-tight">
                {user.email}
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleColor}`}>
              {roleLabel}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
