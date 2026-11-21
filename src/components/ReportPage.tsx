import React from 'react';
import { FileText, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { CampaignConfig, CampaignStats, Member, TransactionLog } from '../types/fund';
import {
  calculateMemberStatus,
  formatBnNumber,
  formatCurrency,
  getCampaignEndDateLabel,
} from '../utils/fundUtils';
import { SavingsGrowthChart } from './SavingsGrowthChart';

interface ReportPageProps {
  config: CampaignConfig;
  stats: CampaignStats;
  members: Member[];
  logs: TransactionLog[];
  simulatedDay?: number | null;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  config,
  stats,
  members,
  logs,
  simulatedDay = null,
}) => {
  const todayStr = new Date().toLocaleDateString('bn-BD');
  const dateRangeLabel = getCampaignEndDateLabel(config);

  const clearMembers = members.filter(
    (m) => calculateMemberStatus(m.totalDeposit, config, simulatedDay).isClear
  );
  const dueMembers = members
    .filter((m) => !calculateMemberStatus(m.totalDeposit, config, simulatedDay).isClear)
    .sort(
      (a, b) =>
        calculateMemberStatus(b.totalDeposit, config, simulatedDay).short -
        calculateMemberStatus(a.totalDeposit, config, simulatedDay).short
    );
  const loanMembers = members
    .filter((m) => m.loanBalance > 0)
    .sort((a, b) => b.loanBalance - a.loanBalance);

  return (
    <div className="space-y-4">
      {/* Page Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
              ফান্ড স্টেটমেন্ট ও রিপোর্ট
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              প্রিন্ট বা PDF হিসেবে সংরক্ষণ করুন
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => window.print()}
          className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation w-full sm:w-auto"
        >
          <Printer className="w-4 h-4 shrink-0" />
          <span>প্রিন্ট / PDF সেভ করুন</span>
        </motion.button>
      </div>

      {/* Printable Document Container */}
      <div
        id="printable-report"
        className="print-only-root bg-slate-900/90 print:bg-white border border-slate-800 print:border-slate-300 rounded-2xl print:rounded-none p-4 sm:p-8 text-slate-100 print:text-slate-900 space-y-6"
      >
        {/* Report Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 print:text-emerald-700">
              {config.title}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              ক্যাম্পেইন সময়কাল: {dateRangeLabel} · দৈনিক {formatCurrency(config.dailyRate)}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-300 print:text-slate-700 space-y-1 bg-slate-950/70 print:bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-800 print:border-slate-300 w-full sm:w-auto">
            <p>
              <strong>রিপোর্ট তৈরির তারিখ:</strong> {todayStr}
            </p>
            <p className="tabular-nums">
              <strong>{simulatedDay !== null ? `দিন ${formatBnNumber(simulatedDay)}-এর` : 'আজকের'} টার্গেট:</strong>{' '}
              {formatBnNumber(stats.passedDays)} দিন ({formatCurrency(stats.todayRequiredPerPerson)})
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300 text-center">
          <div className="py-1">
            <p className="text-xs text-slate-400 print:text-slate-600">মোট সংগৃহীত জমা</p>
            <p className="text-lg font-bold text-emerald-400 print:text-emerald-700 mt-1 font-num">
              {formatCurrency(stats.totalDeposit)}
            </p>
          </div>
          <div className="py-1 sm:border-l border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-400 print:text-slate-600">মোট বকেয়া জমা</p>
            <p className="text-lg font-bold text-rose-400 print:text-rose-700 mt-1 font-num">
              {formatCurrency(stats.totalDueToday)}
            </p>
          </div>
          <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-400 print:text-slate-600">মোট বকেয়া লোন</p>
            <p className="text-lg font-bold text-amber-400 print:text-amber-700 mt-1 font-num">
              {formatCurrency(stats.totalLoan)}
            </p>
          </div>
          <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-400 print:text-slate-600">অবশিষ্ট ক্যাশ</p>
            <p className="text-lg font-bold text-cyan-400 print:text-cyan-700 mt-1 font-num">
              {formatCurrency(stats.netCash)}
            </p>
          </div>
        </div>

        {/* Savings Growth Chart */}
        <SavingsGrowthChart logs={logs} />

        {/* 3-Column Breakdown */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm sm:text-base text-slate-200 print:text-slate-900 border-b border-slate-800 print:border-slate-300 pb-2">
            ২. {simulatedDay !== null ? `দিন ${formatBnNumber(simulatedDay)}` : 'আজ'} পর্যন্ত জমার ভিত্তিতে মেম্বার তালিকা
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/60 print:bg-white border border-emerald-500/30 print:border-slate-300 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-emerald-400 print:text-emerald-700 border-b border-slate-800 print:border-slate-200 pb-1.5">
                সময়মতো জমা ({formatBnNumber(clearMembers.length)} জন)
              </h4>
              <ul className="space-y-1.5 divide-y divide-slate-800/40 print:divide-slate-200">
                {clearMembers.length === 0 ? (
                  <li className="text-slate-500 py-1">কেউ নেই</li>
                ) : (
                  clearMembers.map((m) => (
                    <li key={m.id} className="pt-1.5 flex justify-between gap-2">
                      <span className="truncate">{m.name}</span>
                      <span className="text-emerald-400 print:text-emerald-700 font-bold font-num shrink-0">
                        {formatCurrency(m.totalDeposit)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="bg-slate-950/60 print:bg-white border border-rose-500/30 print:border-slate-300 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-rose-400 print:text-rose-700 border-b border-slate-800 print:border-slate-200 pb-1.5">
                বকেয়া জমা ({formatBnNumber(dueMembers.length)} জন)
              </h4>
              <ul className="space-y-1.5 divide-y divide-slate-800/40 print:divide-slate-200">
                {dueMembers.length === 0 ? (
                  <li className="text-slate-500 py-1">কেউ নেই</li>
                ) : (
                  dueMembers.map((m) => {
                    const st = calculateMemberStatus(
                      m.totalDeposit,
                      config,
                      simulatedDay
                    );
                    return (
                      <li key={m.id} className="pt-1.5 flex justify-between gap-2">
                        <span className="truncate">{m.name}</span>
                        <span className="text-rose-400 print:text-rose-700 font-bold font-num shrink-0">
                          বাকি {formatCurrency(st.short)}
                        </span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="bg-slate-950/60 print:bg-white border border-amber-500/30 print:border-slate-300 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-amber-400 print:text-amber-700 border-b border-slate-800 print:border-slate-200 pb-1.5">
                লোনগ্রহীতা ({formatBnNumber(loanMembers.length)} জন)
              </h4>
              <ul className="space-y-1.5 divide-y divide-slate-800/40 print:divide-slate-200">
                {loanMembers.length === 0 ? (
                  <li className="text-slate-500 py-1">কারো বকেয়া লোন নেই</li>
                ) : (
                  loanMembers.map((m) => (
                    <li key={m.id} className="pt-1.5 flex justify-between gap-2">
                      <span className="truncate">{m.name}</span>
                      <span className="text-amber-400 print:text-amber-700 font-bold font-num shrink-0">
                        {formatCurrency(m.loanBalance)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm sm:text-base text-slate-200 print:text-slate-900 border-b border-slate-800 print:border-slate-300 pb-2">
            ৩. সকল মেম্বারদের বিস্তারিত তালিকা
          </h3>
          <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 print:bg-slate-100 text-slate-400 print:text-slate-800 border-b border-slate-800 print:border-slate-300">
                  <th className="p-3">#</th>
                  <th className="p-3">মেম্বারের নাম</th>
                  <th className="p-3 text-right">মোট জমা</th>
                  <th className="p-3">আজকের স্ট্যাটাস</th>
                  <th className="p-3 text-right">বকেয়া লোন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      কোনো মেম্বার নেই
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => {
                    const st = calculateMemberStatus(
                      m.totalDeposit,
                      config,
                      simulatedDay
                    );
                    return (
                      <tr key={m.id}>
                        <td className="p-3 font-semibold text-slate-400 print:text-slate-600 tabular-nums">
                          {formatBnNumber(idx + 1)}
                        </td>
                        <td className="p-3 font-bold text-slate-200 print:text-slate-900">
                          {m.name}
                        </td>
                        <td className="p-3 text-right text-emerald-400 print:text-emerald-700 font-bold font-num">
                          {formatCurrency(m.totalDeposit)}
                        </td>
                        <td className="p-3">
                          {st.isClear ? (
                            <span className="text-emerald-400 print:text-emerald-700 font-semibold">
                              {formatBnNumber(st.days)} দিন Clear
                            </span>
                          ) : (
                            <span className="text-rose-400 print:text-rose-700 font-semibold">
                              Due ({formatCurrency(st.short)} বাকি)
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-3 text-right font-bold font-num ${
                            m.loanBalance > 0
                              ? 'text-amber-400 print:text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatCurrency(m.loanBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-center text-[11px] text-slate-500">
          {config.title} · ফান্ড স্টেটমেন্ট রিপোর্ট
        </div>
      </div>
    </div>
  );
};
