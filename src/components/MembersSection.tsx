import React from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Coins,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  UserX,
  Wallet,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CampaignConfig, FilterType, Member, SortType } from '../types/fund';
import {
  calculateMemberStatus,
  formatBnNumber,
  formatCurrency,
} from '../utils/fundUtils';

interface MembersSectionProps {
  config: CampaignConfig;
  members: Member[];
  filteredMembers: Member[];
  simulatedDay?: number | null;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: FilterType;
  onFilterChange: (val: FilterType) => void;
  sortBy: SortType;
  onSortChange: (val: SortType) => void;
  isAdmin: boolean;
  onOpenAddMember: () => void;
  onOpenDeposit: () => void;
  onOpenLoan: () => void;
  onQuickDeposit: (memberId: string) => void;
  onQuickLoan: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onResetAll: () => void;
  onSelectMember: (member: Member) => void;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'সকল' },
  { value: 'cleared', label: 'Clear' },
  { value: 'due', label: 'Due' },
  { value: 'loan', label: 'লোনগ্রহীতা' },
];

export const MembersSection: React.FC<MembersSectionProps> = ({
  config,
  members,
  filteredMembers,
  simulatedDay = null,
  searchQuery,
  onSearchChange,
  statusFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  isAdmin,
  onOpenAddMember,
  onOpenDeposit,
  onOpenLoan,
  onQuickDeposit,
  onQuickLoan,
  onDeleteMember,
  onResetAll,
  onSelectMember,
}) => {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            সকল মেম্বারদের বিবরণী
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            বিস্তারিত তথ্য ও লেনদেন দেখতে যেকোনো মেম্বারের ওপর ট্যাপ করুন
          </p>
        </div>
        <span className="text-xs sm:text-sm font-medium text-slate-400 tabular-nums">
          প্রদর্শিত: {formatBnNumber(filteredMembers.length)} /{' '}
          {formatBnNumber(members.length)} জন
        </span>
      </div>

      {/* Toolbar: Search, Filter Chips, Sort, and Admin Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="মেম্বারের নাম খুঁজুন..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="relative sm:w-48">
              <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="সাজানোর ধরন"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortType)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none"
              >
                <option value="default">ডিফল্ট ক্রম</option>
                <option value="name">নাম অনুযায়ী</option>
                <option value="deposit_desc">সর্বোচ্চ জমা</option>
                <option value="deposit_asc">সর্বনিম্ন জমা</option>
                <option value="due_desc">বকেয়া বেশি</option>
                <option value="loan_desc">বকেয়া লোন বেশি</option>
              </select>
            </div>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = statusFilter === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onFilterChange(opt.value)}
                    className={`relative min-h-[38px] sm:min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap touch-manipulation z-10 ${
                      isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="members-filter-pill"
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

          {/* Admin Quick Action Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAddMember}
                className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap touch-manipulation flex-1 sm:flex-initial"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>নতুন মেম্বার</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onOpenDeposit}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap touch-manipulation flex-1 sm:flex-initial"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>জমা যোগ</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLoan}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap touch-manipulation flex-1 sm:flex-initial"
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>লোন</span>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={onResetAll}
                title="ডাটা রিসেট করুন"
                aria-label="ডাটা রিসেট করুন"
                className="min-h-[44px] min-w-[44px] p-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 rounded-xl transition-colors flex items-center justify-center shrink-0 touch-manipulation"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Members Directory Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-10 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              {members.length === 0
                ? 'এখনো কোনো মেম্বার যুক্ত করা হয়নি'
                : 'ফিল্টারের সাথে মিলে এমন কোনো মেম্বার পাওয়া যায়নি'}
            </p>
            {isAdmin && members.length === 0 && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAddMember}
                className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 touch-manipulation"
              >
                <UserPlus className="w-4 h-4" />
                প্রথম মেম্বার যুক্ত করুন
              </motion.button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Touch Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {filteredMembers.map((member, index) => {
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
                    transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.2) }}
                    className="p-4 space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      className="w-full text-left flex items-start justify-between gap-3 active:opacity-80 transition touch-manipulation"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-100 truncate">
                              {member.name}
                            </h4>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                            {status.isClear ? (
                              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {formatBnNumber(status.days)} দিন Clear
                              </span>
                            ) : (
                              <span className="text-rose-400 font-medium inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                বাকি {formatCurrency(status.short)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-emerald-400 font-num">
                          {formatCurrency(member.totalDeposit)}
                        </p>
                        {member.loanBalance > 0 ? (
                          <p className="text-xs font-semibold text-amber-400 font-num mt-0.5">
                            লোন: {formatCurrency(member.loanBalance)}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            {formatBnNumber(status.targetPercent)}% পূর্ণ
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Animated progress indicator */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: status.targetPercent / 100 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        style={{ originX: 0 }}
                        className={`h-full w-full rounded-full ${
                          status.isClear ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    {isAdmin && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onQuickDeposit(member.id)}
                          className="min-h-[44px] px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          জমা
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onQuickLoan(member.id)}
                          className="min-h-[44px] px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                        >
                          <Coins className="w-4 h-4" />
                          লোন
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onDeleteMember(member.id)}
                          className="min-h-[44px] px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" />
                          মুছুন
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop / Tablet Data Table (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold border-b border-slate-800">
                    <th className="px-6 py-3.5">মেম্বারের নাম</th>
                    <th className="px-6 py-3.5 text-right">মোট জমা</th>
                    <th className="px-6 py-3.5">টার্গেট অগ্রগতি</th>
                    <th className="px-6 py-3.5">ডাইনামিক স্ট্যাটাস</th>
                    <th className="px-6 py-3.5 text-right">বকেয়া লোন</th>
                    {isAdmin && <th className="px-6 py-3.5 text-center">একশন</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredMembers.map((member) => {
                    const status = calculateMemberStatus(
                      member.totalDeposit,
                      config,
                      simulatedDay
                    );
                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-semibold text-slate-100">
                          <button
                            type="button"
                            onClick={() => onSelectMember(member)}
                            className="flex items-center gap-3 text-left hover:text-emerald-400 transition-colors touch-manipulation"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="truncate max-w-[200px]">{member.name}</span>
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald-400 font-num">
                          {formatCurrency(member.totalDeposit)}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-[110px]">
                            <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: status.targetPercent / 100 }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                style={{ originX: 0 }}
                                className={`h-full w-full rounded-full ${
                                  status.isClear ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-num w-10 text-right">
                              {formatBnNumber(status.targetPercent)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          {status.isClear ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {formatBnNumber(status.days)} দিন Clear
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                              <XCircle className="w-4 h-4 shrink-0" />
                              Due ({formatCurrency(status.short)} বাকি)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-num">
                          {member.loanBalance > 0 ? (
                            <span className="font-bold text-amber-400">
                              {formatCurrency(member.loanBalance)} বকেয়া
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">নেই</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => onQuickDeposit(member.id)}
                                className="min-h-[38px] px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap touch-manipulation"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                জমা
                              </motion.button>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => onQuickLoan(member.id)}
                                className="min-h-[38px] px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap touch-manipulation"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                লোন
                              </motion.button>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => onDeleteMember(member.id)}
                                title="মেম্বার মুছুন"
                                aria-label="মেম্বার মুছুন"
                                className="min-h-[38px] min-w-[38px] p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors inline-flex items-center justify-center touch-manipulation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
