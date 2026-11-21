import React, { useState } from 'react';
import { CheckCircle2, Clock, HandCoins, Plus, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CampaignConfig, CategoryTab, Member } from '../types/fund';
import {
  calculateMemberStatus,
  formatBnNumber,
  formatCurrency,
} from '../utils/fundUtils';

interface CategoryBreakdownProps {
  config: CampaignConfig;
  members: Member[];
  passedDays: number;
  simulatedDay?: number | null;
  isAdmin: boolean;
  onQuickDeposit: (memberId: string) => void;
  onQuickLoan: (memberId: string) => void;
  onSelectMember: (member: Member) => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  config,
  members,
  passedDays,
  simulatedDay = null,
  isAdmin,
  onQuickDeposit,
  onQuickLoan,
  onSelectMember,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('clear');
  const currentTarget = passedDays * config.dailyRate;

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

  const renderClearCard = () => (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base text-slate-100">
            আপ-টু-ডেট ক্লিয়ার
          </h3>
        </div>
        <span className="text-xs font-semibold text-emerald-400 tabular-nums">
          {formatBnNumber(clearMembers.length)} জন
        </span>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto overscroll-contain pr-0.5">
        {clearMembers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">কেউ ক্লিয়ার নেই</p>
        ) : (
          clearMembers.map((member, index) => {
            const status = calculateMemberStatus(
              member.totalDeposit,
              config,
              simulatedDay
            );
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
                className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 rounded-xl space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="min-w-0 text-left flex-1 touch-manipulation"
                  >
                    <p className="text-sm font-semibold text-slate-100 truncate hover:text-emerald-400 transition-colors">
                      {member.name}
                    </p>
                    <p className="text-xs text-emerald-400 mt-0.5 tabular-nums">
                      জমা: {formatCurrency(member.totalDeposit)} ·{' '}
                      {formatBnNumber(status.days)} দিন ক্লিয়ার
                      {status.advanceDays > 0
                        ? ` (${formatBnNumber(status.advanceDays)} দিন অগ্রিম)`
                        : ''}
                    </p>
                  </button>
                  <span className="text-xs font-semibold text-emerald-400 shrink-0 tabular-nums">
                    {formatBnNumber(status.targetPercent)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: status.targetPercent / 100 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="h-full w-full bg-emerald-500 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderDueCard = () => (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-rose-400 shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base text-slate-100">
            বকেয়া জমা (Due)
          </h3>
        </div>
        <span className="text-xs font-semibold text-rose-400 tabular-nums">
          {formatBnNumber(dueMembers.length)} জন
        </span>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto overscroll-contain pr-0.5">
        {dueMembers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">কারো জমা বাকি নেই</p>
        ) : (
          dueMembers.map((member, index) => {
            const status = calculateMemberStatus(
              member.totalDeposit,
              config,
              simulatedDay
            );
            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
                className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/30 rounded-xl space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member)}
                    className="min-w-0 text-left flex-1 touch-manipulation"
                  >
                    <p className="text-sm font-semibold text-slate-100 truncate hover:text-rose-400 transition-colors">
                      {member.name}
                    </p>
                    <p className="text-xs text-rose-400 mt-0.5 tabular-nums">
                      জমা: {formatCurrency(member.totalDeposit)} · বাকি{' '}
                      {formatCurrency(status.short)}
                    </p>
                  </button>

                  {isAdmin ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onQuickDeposit(member.id)}
                      className="min-h-[40px] sm:min-h-[36px] px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      জমা দিন
                    </motion.button>
                  ) : (
                    <span className="text-xs font-semibold text-rose-400 shrink-0 tabular-nums">
                      {formatBnNumber(status.targetPercent)}%
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: status.targetPercent / 100 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="h-full w-full bg-rose-500 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderLoanCard = () => (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="font-semibold text-sm sm:text-base text-slate-100">
            লোন গ্রহীতা তালিকা
          </h3>
        </div>
        <span className="text-xs font-semibold text-amber-400 tabular-nums">
          {formatBnNumber(loanMembers.length)} জন
        </span>
      </div>

      <div className="space-y-2.5 max-h-[520px] overflow-y-auto overscroll-contain pr-0.5">
        {loanMembers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">কারো লোন বকেয়া নেই</p>
        ) : (
          loanMembers.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.25) }}
              className="min-h-[60px] px-3.5 py-3 bg-slate-950/60 border border-amber-500/25 hover:border-amber-500/45 rounded-xl flex items-center justify-between gap-3 transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelectMember(member)}
                className="min-w-0 text-left flex-1 touch-manipulation"
              >
                <p className="text-sm font-semibold text-slate-100 truncate hover:text-amber-400 transition-colors">
                  {member.name}
                </p>
                <p className="text-xs text-amber-400 mt-0.5 font-semibold tabular-nums">
                  বকেয়া লোন: {formatCurrency(member.loanBalance)}
                </p>
              </button>

              {isAdmin ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onQuickLoan(member.id)}
                  className="min-h-[40px] sm:min-h-[36px] px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 touch-manipulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  পরিশোধ
                </motion.button>
              ) : (
                <span className="text-xs font-semibold text-amber-400 shrink-0">
                  বকেয়া
                </span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            বিভাগীয় তালিকা
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {simulatedDay !== null
              ? `দিন ${formatBnNumber(simulatedDay)} পর্যন্ত জমার ভিত্তিতে ক্লিয়ার, বকেয়া ও লোনগ্রহীতাদের তালিকা`
              : 'আজ পর্যন্ত জমার ভিত্তিতে ক্লিয়ার, বকেয়া ও লোনগ্রহীতাদের তালিকা'}
          </p>
        </div>
        <p className="text-xs sm:text-sm text-emerald-400 font-medium tabular-nums">
          {simulatedDay !== null ? `দিন ${formatBnNumber(simulatedDay)}-এর` : 'আজকের'} টার্গেট (
          {formatBnNumber(passedDays)} দিন × {formatCurrency(config.dailyRate)}):{' '}
          {formatCurrency(currentTarget)}
        </p>
      </div>

      {/* Mobile & Tablet Segmented Tab Switcher (< lg) */}
      <div className="lg:hidden grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        {(
          [
            {
              id: 'clear',
              label: 'ক্লিয়ার',
              count: clearMembers.length,
              activeClass: 'bg-emerald-600',
            },
            {
              id: 'due',
              label: 'বকেয়া',
              count: dueMembers.length,
              activeClass: 'bg-rose-600',
            },
            {
              id: 'loan',
              label: 'লোন',
              count: loanMembers.length,
              activeClass: 'bg-amber-600',
            },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative min-h-[44px] px-2 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap touch-manipulation z-10 ${
                isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="category-tab-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className={`absolute inset-0 rounded-lg -z-10 ${tab.activeClass}`}
                />
              )}
              <span>{tab.label}</span>
              <span className="tabular-nums opacity-90">
                ({formatBnNumber(tab.count)})
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile / Tablet Single Active Panel */}
      <div className="lg:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'clear' && renderClearCard()}
            {activeTab === 'due' && renderDueCard()}
            {activeTab === 'loan' && renderLoanCard()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop 3-Column Grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        {renderClearCard()}
        {renderDueCard()}
        {renderLoanCard()}
      </div>
    </div>
  );
};
