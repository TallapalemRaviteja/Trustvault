import React from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

const TAGS = [
  { name: 'development', count: 48, color: 'hover:bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'branding', count: 29, color: 'hover:bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'marketing', count: 35, color: 'hover:bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'product', count: 62, color: 'hover:bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'security', count: 54, color: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'photography', count: 18, color: 'hover:bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'presentations', count: 23, color: 'hover:bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'compliance', count: 31, color: 'hover:bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'audit-2026', count: 16, color: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const TopTagsCloud: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Top Tags
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">9 popular tags</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {TAGS.map((tag) => (
          <Link
            key={tag.name}
            to={`/documents?search=${encodeURIComponent(tag.name)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1020] border border-slate-200/70 dark:border-[#1E2C48] hover:border-emerald-300 dark:hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group cursor-pointer shadow-2xs"
          >
            <span className="text-slate-400 group-hover:text-emerald-500 font-mono text-[11px]">
              #
            </span>
            <span>{tag.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              ({tag.count})
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
