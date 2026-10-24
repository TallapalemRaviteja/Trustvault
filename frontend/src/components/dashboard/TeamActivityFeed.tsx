import React from 'react';
import { AuditEvent } from '../../types';

interface TeamActivityFeedProps {
  auditEvents?: AuditEvent[];
}

const DEFAULT_FEED = [
  {
    id: 'a-1',
    user: 'Sarah Chen',
    avatar: 'SC',
    action: 'uploaded',
    target: 'Brand Guidelines v3.pdf',
    time: '12m ago',
    type: 'upload',
  },
  {
    id: 'a-2',
    user: 'Alex Rivera',
    avatar: 'AR',
    action: 'modified',
    target: 'Security Access Model.json',
    time: '45m ago',
    type: 'edit',
  },
  {
    id: 'a-3',
    user: 'Carol Danvers',
    avatar: 'CD',
    action: 'downloaded',
    target: 'Q3 Financial Audit.xlsx',
    time: '2h ago',
    type: 'download',
  },
  {
    id: 'a-4',
    user: 'Alice Richardson',
    avatar: 'AR',
    action: 'granted access for',
    target: 'Dave Bowman (READ)',
    time: '4h ago',
    type: 'permission',
  },
  {
    id: 'a-5',
    user: 'David Kim',
    avatar: 'DK',
    action: 'replaced version on',
    target: 'API Gateway Spec v2.pdf',
    time: 'Yesterday',
    type: 'version',
  },
];

export const TeamActivityFeed: React.FC<TeamActivityFeedProps> = ({
  auditEvents = [],
}) => {
  const items =
    auditEvents.length > 0
      ? auditEvents.slice(0, 5).map((ev) => {
          const userStr = ev.actor_email?.split('@')[0] || 'Team Member';
          const initials = userStr
            .split('.')
            .map((s) => s.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);

          return {
            id: ev.id,
            user: ev.actor_email || 'Security Actor',
            avatar: initials || 'TV',
            action: ev.action.toLowerCase().replace(/_/g, ' '),
            target: ev.target_resource_id ? `#${ev.target_resource_id.substring(0, 8)}` : 'Document',
            time: new Date(ev.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: ev.outcome === 'DENIED' ? 'denied' : 'standard',
          };
        })
      : DEFAULT_FEED;

  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Team Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time collaboration and access stream
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="space-y-3.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-500/30">
              {item.avatar}
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="text-slate-800 dark:text-slate-100 leading-snug">
                <span className="font-semibold">{item.user}</span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{item.action}</span>{' '}
                <span className="font-medium text-emerald-700 dark:text-emerald-400 truncate">
                  {item.target}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
