import React from 'react';
import { ShieldAlert, Shield, Lock, Globe } from 'lucide-react';

interface Props {
  level: string;
}

export const SensitivityBadge: React.FC<Props> = ({ level }) => {
  const norm = level.toLowerCase();

  if (norm === 'restricted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <ShieldAlert className="w-3.5 h-3.5" />
        Restricted
      </span>
    );
  }

  if (norm === 'confidential') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Lock className="w-3.5 h-3.5" />
        Confidential
      </span>
    );
  }

  if (norm === 'internal') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Shield className="w-3.5 h-3.5" />
        Internal
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <Globe className="w-3.5 h-3.5" />
      Public
    </span>
  );
};
