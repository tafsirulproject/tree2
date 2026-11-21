import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TransactionLog } from '../types/fund';
import { formatBnNumber, formatCurrency } from '../utils/fundUtils';

interface SavingsGrowthChartProps {
  logs: TransactionLog[];
}

interface ChartPoint {
  index: number;
  shortLabel: string;
  fullDate: string;
  memberName: string;
  addedAmount: number;
  totalSavings: number;
  note: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}

const CustomSavingsTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
      <p className="text-slate-400 tabular-nums">{point.fullDate}</p>
      <p className="font-semibold text-slate-100 truncate">{point.memberName}</p>
      {point.addedAmount > 0 && (
        <p className="text-teal-400 font-num">
          এই লেনদেন: +{formatCurrency(point.addedAmount)}
        </p>
      )}
      <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
        <span className="text-slate-400">মোট সঞ্চয়</span>
        <span className="font-bold text-emerald-400 font-num">
          {formatCurrency(point.totalSavings)}
        </span>
      </div>
    </div>
  );
};

export const SavingsGrowthChart: React.FC<SavingsGrowthChartProps> = ({ logs }) => {
  const prefersReduced = useReducedMotion();

  const { chartData, depositCount, latestSavings } = useMemo(() => {
    const chronologicalDeposits = [...logs]
      .reverse()
      .filter((log) => log.type === 'deposit');

    if (chronologicalDeposits.length === 0) {
      return { chartData: [] as ChartPoint[], depositCount: 0, latestSavings: 0 };
    }

    const points: ChartPoint[] = [
      {
        index: 0,
        shortLabel: 'শুরু',
        fullDate: 'প্রারম্ভিক অবস্থান',
        memberName: 'ফান্ড শুরু',
        addedAmount: 0,
        totalSavings: 0,
        note: 'শুরু',
      },
    ];

    let runningTotal = 0;
    chronologicalDeposits.forEach((log, idx) => {
      const amt = Math.max(0, Number(log.amount) || 0);
      runningTotal += amt;
      const dateOnly = log.date.split(',')[0]?.trim() || log.date;
      points.push({
        index: idx + 1,
        shortLabel: dateOnly,
        fullDate: log.date,
        memberName: log.memberName,
        addedAmount: amt,
        totalSavings: runningTotal,
        note: log.note || 'সাধারণ জমা',
      });
    });

    return {
      chartData: points,
      depositCount: chronologicalDeposits.length,
      latestSavings: runningTotal,
    };
  }, [logs]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 print:border-slate-300 pb-2">
        <h3 className="font-bold text-sm sm:text-base text-slate-200 print:text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400 print:text-emerald-700 shrink-0" />
          <span>১. সময়ের সাথে মোট সঞ্চয় বৃদ্ধির চিত্র</span>
        </h3>
        {depositCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600 font-num">
            <span>{formatBnNumber(depositCount)} টি জমা</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 print:text-emerald-700 font-semibold">
              মোট {formatCurrency(latestSavings)}
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-xl p-3 sm:p-4">
        {depositCount === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center gap-2 px-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 print:bg-slate-200 border border-slate-800 print:border-slate-300 flex items-center justify-center text-slate-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 print:text-slate-600">
              এখনো কোনো জমার লেনদেন পাওয়া যায়নি
            </p>
            <p className="text-xs text-slate-500">
              জমা যোগ করলে এখানে সময়ের সাথে সঞ্চয় বৃদ্ধির লাইন চার্ট দেখা যাবে
            </p>
          </div>
        ) : (
          <div className="w-full h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 14, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  strokeOpacity={0.45}
                  vertical={false}
                />
                <XAxis
                  dataKey="index"
                  tickFormatter={(val) => chartData[Number(val)]?.shortLabel ?? ''}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(val) => formatCurrency(Number(val))}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={68}
                />
                <Tooltip content={<CustomSavingsTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalSavings"
                  name="মোট সঞ্চয়"
                  stroke="#10b981"
                  strokeWidth={2.75}
                  dot={{
                    r: 3.5,
                    fill: '#10b981',
                    stroke: '#020617',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#34d399',
                    stroke: '#020617',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={!prefersReduced}
                  animationDuration={650}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
