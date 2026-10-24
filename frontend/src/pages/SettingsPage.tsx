import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Sliders,
  Sun,
  Moon,
  Shield,
  Key,
  Lock,
  User,
  CheckCircle2,
  Cpu,
  Database,
  Radio,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    showToast(`Switched theme to ${newTheme} mode.`, 'info', 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Page Title */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-md">
        <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FC]">
          Security & Account Settings
        </h1>
        <p className="text-xs text-[#9BA8BD] mt-1">
          Manage your interface preferences, security parameters, and review active cryptographic safeguards.
        </p>
      </div>

      {/* Theme & Display Preferences */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1E2C48]">
          <Sliders className="w-4 h-4 text-[#4F8CFF]" />
          <h2 className="text-sm font-bold text-white">Visual Interface Theme</h2>
        </div>

        <p className="text-xs text-[#9BA8BD]">
          Choose your visual appearance. Midnight Navy is the signature zero-trust cybersecurity aesthetic.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#18243C] border-[#4F8CFF] shadow-cyber-glow'
                : 'bg-[#0B1020] border-[#1E2C48] hover:border-[#4F8CFF]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Moon className="w-4 h-4 text-[#42D9E8]" />
                <span>Midnight Navy (Signature Dark)</span>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#42D9E8]" />}
            </div>
            <p className="text-[11px] text-[#9BA8BD] leading-snug">
              Deep midnight navy (#0B1020) with electric blue and cyan glowing accents.
            </p>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 border-[#4F8CFF] shadow-md'
                : 'bg-[#0B1020] border-[#1E2C48] hover:border-[#4F8CFF]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Enterprise Slate (Light)</span>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-[#9BA8BD] leading-snug">
              Crisp light slate background with high-contrast data presentation.
            </p>
          </button>
        </div>
      </div>

      {/* Account Profile & Credentials Info */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1E2C48]">
          <User className="w-4 h-4 text-[#42D9E8]" />
          <h2 className="text-sm font-bold text-white">Identity & Privilege Matrix</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <span className="text-[#9BA8BD] text-[11px] font-mono uppercase block">Authenticated Name</span>
            <span className="text-white font-semibold text-sm mt-0.5 block">{user?.full_name}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <span className="text-[#9BA8BD] text-[11px] font-mono uppercase block">Corporate Email</span>
            <span className="text-white font-mono text-xs mt-0.5 block">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <span className="text-[#9BA8BD] text-[11px] font-mono uppercase block">Assigned Role</span>
            <span className="text-[#42D9E8] font-mono font-bold uppercase mt-0.5 block">{user?.role}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <span className="text-[#9BA8BD] text-[11px] font-mono uppercase block">Account Security Status</span>
            <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active & Verified
            </span>
          </div>
        </div>
      </div>

      {/* Cryptographic Architecture Technical Review */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1E2C48]">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Cryptographic Standards Spec</h2>
        </div>

        <div className="space-y-3 text-xs text-[#9BA8BD]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-[#4F8CFF]" />
              <span className="text-white font-medium">Password Derivation</span>
            </div>
            <span className="font-mono text-[#42D9E8]">Argon2id (Time=3, Mem=64MB, Par=4)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-medium">Audit Ledger Chaining</span>
            </div>
            <span className="font-mono text-emerald-400">SHA-256 Recursive Chaining</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium">Session Protection</span>
            </div>
            <span className="font-mono text-purple-300">HttpOnly, SameSite=Strict Cookies</span>
          </div>
        </div>
      </div>
    </div>
  );
};
