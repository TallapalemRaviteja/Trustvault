import React from 'react';
import { Crown, Edit3, Eye, Slash } from 'lucide-react';

interface Props {
  permission?: 'OWNER' | 'EDIT' | 'READ' | string | null;
}

export const PermissionBadge: React.FC<Props> = ({ permission }) => {
  if (permission === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <Crown className="w-3 h-3 text-purple-500" />
        Owner
      </span>
    );
  }

  if (permission === 'EDIT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <Edit3 className="w-3 h-3 text-sky-500" />
        Editor (Full)
      </span>
    );
  }

  if (permission === 'READ') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Eye className="w-3 h-3 text-emerald-500" />
        Viewer (Read)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
      <Slash className="w-3 h-3" />
      None
    </span>
  );
};
