import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  FolderOpen,
  RotateCcw,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LogFilterType, TransactionLog } from '../types/fund';
import { formatBnNumber, formatCurrency } from '../utils/fundUtils';
import { AnimatedNumber } from './AnimatedNumber';

interface TransactionLogsProps {
  logs: TransactionLog[];
}

const LOG_FILTER_OPTIONS: { value: LogFilterType; label: string }[] = [
  { value: 'all', label: 'সকল' },
  { value: 'deposit', label: 'জমা' },
  { value: 'loan_issue', label: 'লোন দেওয়া' },
  { value: 'loan_repay', label: 'লোন পরিশোধ' },
];

export const TransactionLogs: React.FC<TransactionLogsProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<LogFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (log.type === 'deposit') acc.deposits += log.amount;
        else if (log.type === 'loan_issue') acc.loansIssued += log.amount;
        else if (log.type === 'loan_repay') acc.loansRepaid += log.amount;
        return acc;
      },
      { deposits: 0, loansIssued: 0, loansRepaid: 0 }
    );
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesQuery =
        !q ||
        log.memberName.toLowerCase().includes(q) ||
        (log.note || '').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [logs, filterType, searchQuery]);

  const renderTypeLabel = (type: TransactionLog['type']) => {
    if (type === 'deposit') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
          জমা
        </span>
      );
    }
    if (type === 'loan_issue') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          লোন দেওয়া
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400">
        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
        লোন পরিশোধ
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            লেনদেনের ইতিহাস (Audit Log)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            সকল জমা ও লোনের সম্পূর্ণ হিসাব
          </p>
        </div>
        <span className="text-xs sm:text-sm text-slate-400 tabular-nums">
          মোট {formatBnNumber(filteredLogs.length)} টি লেনদেন
        </span>
      </div>

      {/* Animated Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">মোট জমা লেনদেন</p>
          <p className="text-base sm:text-xl font-bold text-emerald-400 font-num mt-1">
            <AnimatedNumber value={summary.deposits} formatter={formatCurrency} />
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">লোন প্রদান</p>
          <p className="text-base sm:text-xl font-bold text-amber-400 font-num mt-1">
            <AnimatedNumber value={summary.loansIssued} formatter={formatCurrency} />
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs text-slate-400 truncate">লোন পরিশোধ</p>
          <p className="text-base sm:text-xl font-bold text-cyan-400 font-num mt-1">
            <AnimatedNumber value={summary.loansRepaid} formatter={formatCurrency} />
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা বিবরণ দিয়ে খুঁজুন..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center overflow-x-auto pb-0.5 sm:pb-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
            {LOG_FILTER_OPTIONS.map((opt) => {
              const isSelected = filterType === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setFilterType(opt.value)}
                  className={`relative min-h-[38px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap touch-manipulation z-10 ${
                    isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="logs-filter-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-emerald-600 rounded-lg -z-10"
                    />
                  )}
                  <span>{opt.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 sm:p-12 text-center space-y-2">
            <FolderOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500">
              {logs.length === 0
                ? 'কোনো লেনদেনের রেকর্ড নেই'
                : 'ফিল্টারের সাথে মিলে এমন কোনো লেনদেন পাওয়া যায়নি'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile List Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-800/70">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {log.memberName}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      {renderTypeLabel(log.type)}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {log.note || '-'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 shrink-0" />
                      {log.date}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-100 font-num shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                    <th className="px-6 py-3.5">তারিখ ও সময়</th>
                    <th className="px-6 py-3.5">মেম্বার</th>
                    <th className="px-6 py-3.5">ধরন</th>
                    <th className="px-6 py-3.5 text-right">পরিমাণ</th>
                    <th className="px-6 py-3.5">নোট / বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 text-slate-400 tabular-nums whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-200">
                        {log.memberName}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {renderTypeLabel(log.type)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-100 font-num">
                        {formatCurrency(log.amount)}
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {log.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
