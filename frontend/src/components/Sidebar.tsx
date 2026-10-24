import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustVaultLogo } from './TrustVaultLogo';
import {
  LayoutDashboard,
  HardDrive,
  FolderKanban,
  Users,
  Tags,
  Star,
  Clock,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  ChevronLeft,
  ShieldCheck,
  FileKey2,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(true);

  if (!user) return null;

  const folders = [
    { name: 'Design System', count: 45, category: 'Design' },
    { name: 'Engineering', count: 92, category: 'Technical' },
    { name: 'Marketing', count: 34, category: 'Marketing' },
    { name: 'Product', count: 61, category: 'Strategic' },
    { name: 'Operations', count: 27, category: 'Operations' },
  ];

  const collections = [
    { name: 'Brand Kit 2025', count: 48 },
    { name: 'Q1 Campaigns', count: 32 },
    { name: 'Product Screenshots', count: 115 },
    { name: 'Release v2.5', count: 18 },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between overflow-y-auto font-sans select-none">
      <div>
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-[#1E2C48]">
          <div className="flex items-center gap-2.5">
            <TrustVaultLogo size="sm" showText={!isCollapsed} />
            {!isCollapsed && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                Enterprise
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162137] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Button: Large pill "+ New Upload" in vibrant mint green */}
        <div className="p-3">
          <Link
            to="/upload"
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#10B981] to-[#34D399] hover:opacity-95 shadow-mint-glow transition-all flex items-center justify-center gap-2 group cursor-pointer ${
              isCollapsed ? 'px-2' : ''
            }`}
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            {!isCollapsed && <span>+ New Upload</span>}
          </Link>
        </div>

        {/* Section 1: WORKSPACE */}
        <div className="px-3 py-1.5">
          {!isCollapsed && (
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3 mb-1.5">
              Workspace
            </div>
          )}
          <nav className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>

            <NavLink
              to="/documents"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? 'Drive' : undefined}
            >
              <HardDrive className="w-4 h-4" />
              {!isCollapsed && <span>Drive</span>}
            </NavLink>

            <NavLink
              to="/permissions"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? 'Access Control' : undefined}
            >
              <FileKey2 className="w-4 h-4" />
              {!isCollapsed && <span>Permissions</span>}
            </NavLink>

            <NavLink
              to="/audit"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? 'Audit Ledger' : undefined}
            >
              <History className="w-4 h-4" />
              {!isCollapsed && <span>Audit Trail</span>}
            </NavLink>
          </nav>
        </div>

        {/* Section 2: LIBRARY */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-[#1E2C48]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3 mb-1.5">
              Library
            </div>
            <nav className="space-y-0.5">
              <Link
                to="/documents"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Starred</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">12</span>
              </Link>

              <Link
                to="/documents"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Recent</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">23</span>
              </Link>

              <Link
                to="/documents?deleted=true"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Trash</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">4</span>
              </Link>
            </nav>
          </div>
        )}

        {/* Section 3: FOLDERS (Collapsible) */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-[#1E2C48]">
            <button
              type="button"
              onClick={() => setFoldersOpen(!foldersOpen)}
              className="w-full flex items-center justify-between px-3 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 cursor-pointer"
            >
              <span>Folders</span>
              {foldersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {foldersOpen && (
              <div className="space-y-0.5">
                {folders.map((f) => (
                  <Link
                    key={f.name}
                    to={`/documents?category=${encodeURIComponent(f.category)}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {f.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: COLLECTIONS */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-slate-100 dark:border-[#1E2C48]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold px-3 mb-1.5">
              Collections
            </div>
            <div className="space-y-0.5">
              {collections.map((col) => (
                <Link
                  key={col.name}
                  to={`/documents?search=${encodeURIComponent(col.name)}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-[#162137] hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="truncate">{col.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {col.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Profile & Storage Card */}
      <div className="p-3 border-t border-slate-100 dark:border-[#1E2C48] space-y-3">
        {/* Storage Progress Bar */}
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1020] border border-slate-200/70 dark:border-[#1E2C48]">
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-mono">
              <span>Cloud Storage</span>
              <span className="font-semibold text-slate-800 dark:text-white">11.4 / 25 GB</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full"
                style={{ width: '45%' }}
              />
            </div>
          </div>
        )}

        {/* User Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#0B1020] border border-slate-200/60 dark:border-[#1E2C48] ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0 pr-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {user.email}
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 uppercase">
                Pro
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-white dark:bg-[#0B1020] border-r border-slate-200/80 dark:border-[#1E2C48] transition-all duration-300 min-h-[calc(100vh-4rem)] ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0B1020] border-r border-slate-200 dark:border-[#1E2C48] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
