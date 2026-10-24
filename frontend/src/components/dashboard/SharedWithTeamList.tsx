import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Users, FileText, Lock } from 'lucide-react';
import { DocumentItem } from '../../types';

interface SharedWithTeamProps {
  documents?: DocumentItem[];
}

const DEFAULT_SHARED = [
  {
    id: 's-1',
    title: 'Customer Success Playbook 2026',
    category: 'Operations',
    avatars: ['SC', 'AR', 'TM', '+2'],
    permission: 'EDIT',
    updated: '2h ago',
  },
  {
    id: 's-2',
    title: 'Q4 Product Roadmap & Spec',
    category: 'Product',
    avatars: ['DK', 'MJ'],
    permission: 'READ',
    updated: '5h ago',
  },
  {
    id: 's-3',
    title: 'Enterprise Security Architecture v2',
    category: 'Security',
    avatars: ['SA', 'CD', 'AR', '+4'],
    permission: 'EDIT',
    updated: 'Yesterday',
  },
  {
    id: 's-4',
    title: 'Master Service Agreement Template',
    category: 'Legal',
    avatars: ['BW', 'SC'],
    permission: 'READ',
    updated: '3 days ago',
  },
];

export const SharedWithTeamList: React.FC<SharedWithTeamProps> = ({
  documents = [],
}) => {
  const items =
    documents.length > 0
      ? documents.slice(0, 4).map((doc, idx) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          avatars: idx % 2 === 0 ? ['AL', 'CD', '+2'] : ['SC', 'AR'],
          permission: doc.user_effective_permission || 'READ',
          updated: new Date(doc.updated_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          }),
        }))
      : DEFAULT_SHARED;

  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Shared with Team
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Collaborative assets with team access grants
          </p>
        </div>
        <Link
          to="/permissions"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          Manage ACL →
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-[#0B1020]/60 border border-slate-100 dark:border-[#1E2C48] hover:border-slate-200 dark:hover:border-[#2E436B] transition-all"
          >
            <div className="min-w-0 pr-3">
              <Link
                to={`/documents/${item.id}`}
                className="text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate block transition-colors"
              >
                {item.title}
              </Link>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {item.category}
                </span>
                <span>•</span>
                <span>{item.updated}</span>
              </div>
            </div>

            {/* Right: Overlapping Team Avatars */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex -space-x-1.5 overflow-hidden">
                {item.avatars.map((av, avIdx) => (
                  <div
                    key={avIdx}
                    className="inline-block w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#121A2B] bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono shadow-xs"
                  >
                    {av}
                  </div>
                ))}
              </div>

              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  item.permission === 'EDIT'
                    ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                }`}
              >
                {item.permission}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
