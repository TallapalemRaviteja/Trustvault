import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StorageCategory {
  name: string;
  size: string;
  value: number;
  color: string;
}

const STORAGE_DATA: StorageCategory[] = [
  { name: 'Documents', size: '4.2 GB', value: 42, color: '#10B981' },
  { name: 'Images', size: '3.1 GB', value: 31, color: '#38BDF8' },
  { name: 'Videos', size: '2.4 GB', value: 24, color: '#A855F7' },
  { name: 'Design', size: '1.2 GB', value: 12, color: '#F59E0B' },
  { name: 'Other', size: '0.5 GB', value: 5, color: '#94A3B8' },
];

export const StorageDonut: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Storage Breakdown
        </h3>
        <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
          11.4 / 25 GB
        </span>
      </div>

      {/* Donut Chart with Centered Total */}
      <div className="h-44 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={STORAGE_DATA}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {STORAGE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`${val}%`, 'Usage']}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '11px',
                color: '#0F172A',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">45%</span>
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Used</span>
        </div>
      </div>

      {/* Categories Legend List */}
      <div className="space-y-1.5 mt-2">
        {STORAGE_DATA.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between text-xs py-0.5 text-slate-600 dark:text-slate-300"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium">{cat.name}</span>
            </div>
            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
              {cat.size}
            </span>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2C48]">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Overall Cloud Quota</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">13.6 GB Free</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1E2C48] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all duration-500"
            style={{ width: '45%' }}
          />
        </div>
      </div>
    </div>
  );
};
