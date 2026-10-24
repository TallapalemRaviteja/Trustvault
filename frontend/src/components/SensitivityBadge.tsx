import React from 'react';
import { ShieldAlert, Shield, Lock, Globe } from 'lucide-react';

interface Props {
  level?: string;
  sensitivity?: string;
}

export const SensitivityBadge: React.FC<Props> = ({ level, sensitivity }) => {
  const val = (level || sensitivity || 'INTERNAL').toLowerCase();

  if (val === 'restricted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
        <ShieldAlert className="w-3 h-3 text-rose-400" />
        Restricted
      </span>
    );
  }

  if (val === 'confidential') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Lock className="w-3 h-3 text-amber-400" />
        Confidential
      </span>
    );
  }

  if (val === 'internal') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#4F8CFF]/15 text-[#42D9E8] border border-[#4F8CFF]/30">
        <Shield className="w-3 h-3 text-[#42D9E8]" />
        Internal
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
      <Globe className="w-3 h-3" />
      Public
    </span>
  );
};
