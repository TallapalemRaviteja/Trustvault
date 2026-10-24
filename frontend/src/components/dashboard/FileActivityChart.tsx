import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface FileActivityChartProps {
  data?: Array<{
    day: string;
    uploads: number;
    modifications: number;
  }>;
}

const DEFAULT_ACTIVITY = [
  { day: 'Oct 11', uploads: 5, modifications: 3 },
  { day: 'Oct 12', uploads: 8, modifications: 6 },
  { day: 'Oct 13', uploads: 12, modifications: 7 },
  { day: 'Oct 14', uploads: 4, modifications: 2 },
  { day: 'Oct 15', uploads: 9, modifications: 5 },
  { day: 'Oct 16', uploads: 15, modifications: 8 },
  { day: 'Oct 17', uploads: 7, modifications: 4 },
  { day: 'Oct 18', uploads: 11, modifications: 9 },
  { day: 'Oct 19', uploads: 16, modifications: 6 },
  { day: 'Oct 20', uploads: 6, modifications: 4 },
  { day: 'Oct 21', uploads: 14, modifications: 10 },
  { day: 'Oct 22', uploads: 18, modifications: 8 },
  { day: 'Oct 23', uploads: 12, modifications: 7 },
  { day: 'Oct 24', uploads: 21, modifications: 11 },
];

export const FileActivityChart: React.FC<FileActivityChartProps> = ({
  data = DEFAULT_ACTIVITY,
}) => {
  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            File Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily upload & modification volume over the past 14 days
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
            <span>Uploads</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
            <span>Modifications</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }} barGap={2}>
            <XAxis
              dataKey="day"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(16, 185, 129, 0.04)' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '11px',
                color: '#0F172A',
              }}
            />
            <Bar
              dataKey="uploads"
              name="Uploads"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
            <Bar
              dataKey="modifications"
              name="Modifications"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
