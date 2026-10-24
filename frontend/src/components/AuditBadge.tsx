import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface Props {
  status: string;
  isValid: boolean;
  totalEvents?: number;
}

export const AuditBadge: React.FC<Props> = ({ status, isValid, totalEvents }) => {
  if (isValid) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <div className="text-xs">
          <span className="font-semibold">Cryptographically Verified</span>
          {totalEvents !== undefined && <span className="ml-1 text-emerald-600">({totalEvents} events)</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
      <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
      <div className="text-xs">
        <span className="font-semibold">Tampering Detected</span>
        <span className="ml-1 text-rose-600">[{status}]</span>
      </div>
    </div>
  );
};
