import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, ChevronRight } from 'lucide-react';

interface FolderTile {
  name: string;
  count: number;
  size: string;
  category: string;
  iconBg: string;
  iconColor: string;
}

const FOLDERS: FolderTile[] = [
  {
    name: 'Design Sys',
    count: 45,
    size: '1.8 GB',
    category: 'Design',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    name: 'Engineering',
    count: 92,
    size: '4.2 GB',
    category: 'Technical',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    name: 'Marketing',
    count: 34,
    size: '2.5 GB',
    category: 'Marketing',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    name: 'Product',
    count: 61,
    size: '3.1 GB',
    category: 'Strategic',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    name: 'Operations',
    count: 27,
    size: '1.2 GB',
    category: 'Operations',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

export const QuickAccessFolders: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Quick Access Folders
        </h3>
        <span className="text-xs text-slate-400 font-mono">5 active workspaces</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FOLDERS.map((f) => (
          <Link
            key={f.name}
            to={`/documents?category=${encodeURIComponent(f.category)}`}
            className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0B1020]/60 border border-slate-100 dark:border-[#1E2C48] hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.iconBg} ${f.iconColor} group-hover:scale-110 transition-transform`}
              >
                <Folder className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate transition-colors">
                {f.name}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>{f.count} files</span>
                <span>{f.size}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
