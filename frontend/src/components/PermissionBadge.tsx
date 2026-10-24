import React from 'react';
import { Crown, Edit3, Eye, Slash } from 'lucide-react';

interface Props {
  permission?: 'OWNER' | 'EDIT' | 'READ' | string | null;
}

export const PermissionBadge: React.FC<Props> = ({ permission }) => {
  if (permission === 'OWNER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <Crown className="w-3 h-3 text-purple-400" />
        Owner
      </span>
    );
  }

  if (permission === 'EDIT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#42D9E8]/15 text-[#42D9E8] border border-[#42D9E8]/30">
        <Edit3 className="w-3 h-3 text-[#42D9E8]" />
        Editor (Full)
      </span>
    );
  }

  if (permission === 'READ') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <Eye className="w-3 h-3 text-emerald-400" />
        Viewer (Read)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-[#9BA8BD] bg-[#18243C] border border-[#1E2C48]">
      <Slash className="w-3 h-3" />
      None
    </span>
  );
};
