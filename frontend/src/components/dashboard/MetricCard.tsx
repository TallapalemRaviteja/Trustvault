import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  footer: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  footer,
  icon: Icon,
  iconBg,
  iconColor,
  badgeText,
  badgeColor = 'text-emerald-700 dark:text-emerald-400',
  badgeBg = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20',
}) => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Row: Icon & Top-Right Badge */}
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>

        {badgeText && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono border ${badgeBg} ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Metric Content */}
      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
          {title}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E2C48] text-[11px] text-slate-400 dark:text-[#9BA8BD] flex items-center justify-between">
        <span>{footer}</span>
      </div>
    </div>
  );
};
