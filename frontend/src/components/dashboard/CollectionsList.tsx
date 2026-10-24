import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, MoreVertical, FolderKanban } from 'lucide-react';

const COLLECTIONS = [
  {
    id: 'col-1',
    name: 'Brand Kit 2025',
    filesCount: 48,
    size: '1.2 GB',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    category: 'Design',
  },
  {
    id: 'col-2',
    name: 'Q1 Campaigns',
    filesCount: 32,
    size: '840 MB',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    category: 'Marketing',
  },
  {
    id: 'col-3',
    name: 'Product Screenshots',
    filesCount: 115,
    size: '2.8 GB',
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    category: 'Product',
  },
  {
    id: 'col-4',
    name: 'Release v2.5',
    filesCount: 18,
    size: '450 MB',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    category: 'Technical',
  },
];

export const CollectionsList: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Collections
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Curated workspace asset sets
          </p>
        </div>
        <Link
          to="/documents"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-3">
        {COLLECTIONS.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-[#0B1020]/60 border border-slate-100 dark:border-[#1E2C48] hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}
              >
                <FolderKanban className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <Link
                  to={`/documents?category=${encodeURIComponent(c.category)}`}
                  className="text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate block transition-colors"
                >
                  {c.name}
                </Link>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  {c.filesCount} files • {c.size}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
