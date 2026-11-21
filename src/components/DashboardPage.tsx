import React from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  HandCoins,
  Plus,
  RotateCcw,
  Settings2,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AppPage,
  CampaignConfig,
  CampaignStats,
  Member,
  TransactionLog,
} from '../types/fund';
import {
  calculateMemberStatus,
  formatBnNumber,
  formatCurrency,
  getCampaignEndDateLabel,
} from '../utils/fundUtils';
import { AnimatedNumber } from './AnimatedNumber';
import { LivingFundTree } from './LivingFundTree';

interface DashboardPageProps {
  config: CampaignConfig;
  stats: CampaignStats;
  members: Member[];
  logs: TransactionLog[];
  simulatedDay: number | null;
  onSimulateDayChange: (day: number | null) => void;
  isAdmin: boolean;
  onNavigate: (page: AppPage) => void;
  onOpenSettings: () => void;
  onOpenAddMember: () => void;
  onOpenDeposit: (memberId?: string) => void;
  onOpenLoan: (memberId?: string) => void;
  onSelectMember: (member: Member) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  config,
  stats,
  members,
  logs,
  simulatedDay,
  onSimulateDayChange,
  isAdmin,
  onNavigate,
  onOpenSettings,
  onOpenAddMember,
  onOpenDeposit,
  onOpenLoan,
  onSelectMember,
}) => {
  const dueMembers = members
    .filter((m) => !calculateMemberStatus(m.totalDeposit, config, simulatedDay).isClear)
    .sort(
      (a, b) =>
        calculateMemberStatus(b.totalDeposit, config, simulatedDay).short -
        calculateMemberStatus(a.totalDeposit, config, simulatedDay).short
    );

  const recentLogs = logs.slice(0, 5);
  const dateRangeLabel = getCampaignEndDateLabel(config);

  const activeDayDisplay = simulatedDay ?? (stats.isBeforeStart ? 1 : stats.passedDays);

  return (
    <div className="space-y-6">
      {/* Campaign Progress Banner */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{dateRangeLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">দৈনিক {formatCurrency(config.dailyRate)}</span>
              <span aria-hidden="true">·</span>
              <span className={isAdmin ? 'text-amber-400 font-semibold' : 'text-cyan-400 font-medium'}>
                {isAdmin ? 'এডমিন মোড' : 'মেম্বার ভিউ'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
              {stats.isBeforeStart && simulatedDay === null
                ? `অভিযান শুরু হতে ${formatBnNumber(stats.daysUntilStart)} দিন বাকি`
                : `অভিযান চলছে (দিন: ${formatBnNumber(stats.passedDays)}/${formatBnNumber(config.totalDays)})`}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {isAdmin && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={onOpenSettings}
                className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation flex-1 sm:flex-initial"
              >
                <Settings2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>সেটিংস</span>
              </motion.button>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onNavigate('report')}
              className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation flex-1 sm:flex-initial"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>রিপোর্ট / PDF</span>
            </motion.button>
          </div>
        </div>

        {/* Campaign Stats + Living Tree Animation + Dual Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
          {/* Interactive Living Fund Tree */}
          <div className="lg:col-span-4">
            <LivingFundTree
              progressPercent={stats.overallProgressPercent}
              memberCount={members.length}
              clearCount={stats.clearCount}
              totalDeposit={stats.totalDeposit}
            />
          </div>

          <div className="lg:col-span-8 space-y-4">
            {/* Accurate Dual Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-xs text-slate-400">আজকের টার্গেট / জন</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-num">
                  <AnimatedNumber
                    value={stats.todayRequiredPerPerson}
                    formatter={formatCurrency}
                  />
                </p>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-xs text-slate-400">আজকের মোট বকেয়া</p>
                <p
                  className={`text-lg sm:text-xl font-bold mt-1 font-num ${
                    stats.totalDueToday > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  <AnimatedNumber
                    value={stats.totalDueToday}
                    formatter={formatCurrency}
                  />
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
                <p className="text-xs text-slate-400">প্রতি জনের মোট টার্গেট</p>
                <p className="text-lg sm:text-xl font-bold text-teal-400 mt-1 font-num">
                  {formatCurrency(stats.totalTargetPerPerson)}
                </p>
              </div>
            </div>

            {/* Today Collection vs Overall Progress */}
            <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
              {/* Animated SVG Ring for Today's Target Collection */}
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-800"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="text-emerald-400"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: stats.todayCollectionPercent / 100 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <span className="absolute text-xs font-bold text-emerald-400 font-num">
                  <AnimatedNumber
                    value={stats.todayCollectionPercent}
                    formatter={(v) => `${formatBnNumber(v)}%`}
                  />
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
                  <span className="text-slate-400 flex items-center gap-1.5 truncate">
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>মোট ক্যাম্পেইন অগ্রগতি</span>
                  </span>
                  <span className="text-emerald-400 font-bold font-num shrink-0">
                    <AnimatedNumber
                      value={stats.overallProgressPercent}
                      formatter={(v) => `${formatBnNumber(v)}%`}
                    />
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: stats.overallProgressPercent / 100 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-num gap-2">
                  <span className="truncate">
                    আজকের কালেকশন: {formatBnNumber(stats.todayCollectionPercent)}% · বাকি{' '}
                    {formatBnNumber(stats.daysRemaining)} দিন
                  </span>
                  <span className="shrink-0">
                    {formatCurrency(stats.totalDeposit)} /{' '}
                    {formatCurrency(stats.totalTargetAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Day Simulator / Time Scrubber */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-300">
                  দিন অনুযায়ী হিসাব দেখুন ({formatBnNumber(activeDayDisplay)}/{formatBnNumber(config.totalDays)} দিন)
                </span>
                {simulatedDay !== null ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onSimulateDayChange(null)}
                    className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg font-semibold transition touch-manipulation"
                  >
                    আজকের দিনে ফিরুন
                  </motion.button>
                ) : (
                  <span className="text-emerald-400 font-medium">লাইভ (আজ)</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() =>
                    onSimulateDayChange(Math.max(1, activeDayDisplay - 1))
                  }
                  aria-label="আগের দিন"
                  className="min-h-[38px] min-w-[38px] bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>

                <input
                  type="range"
                  min={1}
                  max={config.totalDays}
                  value={activeDayDisplay}
                  onChange={(e) => onSimulateDayChange(Number(e.target.value))}
                  aria-label="ক্যাম্পেইন দিন নির্বাচন"
                  className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() =>
                    onSimulateDayChange(Math.min(config.totalDays, activeDayDisplay + 1))
                  }
                  aria-label="পরের দিন"
                  className="min-h-[38px] min-w-[38px] bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-300 touch-manipulation"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Admin Quick Launch Bar */}
      {isAdmin && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-3 gap-2.5 sm:gap-4"
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={onOpenAddMember}
            className="min-h-[48px] px-3 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-100 touch-manipulation"
          >
            <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">নতুন মেম্বার</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => onOpenDeposit()}
            className="min-h-[48px] px-3 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-100 touch-manipulation"
          >
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">জমা যোগ</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={() => onOpenLoan()}
            className="min-h-[48px] px-3 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-100 touch-manipulation"
          >
            <HandCoins className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">লোন ম্যানেজ</span>
          </motion.button>
        </motion.section>
      )}

      {/* 4 Interactive Staggered KPI Metric Cards */}
      <motion.section
        aria-label="ফান্ডের সারসংক্ষেপ"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
      >
        <motion.button
          type="button"
          variants={cardVariants}
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('members')}
          className="text-left bg-slate-900/90 hover:bg-slate-900 hover:border-emerald-500/30 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-2 transition-colors touch-manipulation"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">মোট জমা ফান্ড</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 mt-1.5 font-num truncate">
              <AnimatedNumber value={stats.totalDeposit} formatter={formatCurrency} />
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </motion.button>

        <motion.button
          type="button"
          variants={cardVariants}
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('categories')}
          className="text-left bg-slate-900/90 hover:bg-slate-900 hover:border-amber-500/30 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-2 transition-colors touch-manipulation"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">মোট বকেয়া লোন</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-400 mt-1.5 font-num truncate">
              <AnimatedNumber value={stats.totalLoan} formatter={formatCurrency} />
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <HandCoins className="w-5 h-5" />
          </div>
        </motion.button>

        <motion.button
          type="button"
          variants={cardVariants}
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('transactions')}
          className="text-left bg-slate-900/90 hover:bg-slate-900 hover:border-cyan-500/30 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-2 transition-colors touch-manipulation"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">হাতে অবশিষ্ট ক্যাশ</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400 mt-1.5 font-num truncate">
              <AnimatedNumber value={stats.netCash} formatter={formatCurrency} />
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </motion.button>

        <motion.button
          type="button"
          variants={cardVariants}
          whileTap={{ scale: 0.94 }}
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('members')}
          className="text-left bg-slate-900/90 hover:bg-slate-900 hover:border-violet-500/30 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-2 transition-colors touch-manipulation"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">মোট মেম্বার</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-violet-400 mt-1.5 font-num truncate">
              <AnimatedNumber
                value={members.length}
                formatter={(v) => `${formatBnNumber(v)} জন`}
              />
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </motion.button>
      </motion.section>

      {/* Dynamic Overview Split: Due Highlights + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Dues Preview */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.12 }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="px-4 sm:px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <h2 className="font-bold text-base text-slate-100">বকেয়া তালিকা (সংক্ষিপ্ত)</h2>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onNavigate('categories')}
              className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 touch-manipulation"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="divide-y divide-slate-800/70 flex-1">
            {members.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                এখনো কোনো মেম্বার যুক্ত করা হয়নি
              </div>
            ) : dueMembers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  সকল মেম্বারের জমা {formatBnNumber(stats.passedDays)} দিন পর্যন্ত ক্লিয়ার রয়েছে
                </p>
              </div>
            ) : (
              dueMembers.slice(0, 5).map((member, index) => {
                const st = calculateMemberStatus(member.totalDeposit, config, simulatedDay);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMember(member)}
                      className="min-w-0 text-left flex-1 py-1 touch-manipulation"
                    >
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-rose-400 font-num mt-0.5">
                        জমা {formatCurrency(member.totalDeposit)} · বাকি {formatCurrency(st.short)}
                      </p>
                    </button>

                    {isAdmin && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onOpenDeposit(member.id)}
                        className="min-h-[40px] px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 touch-manipulation"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>জমা</span>
                      </motion.button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Recent 5 Activity Preview */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.16 }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="px-4 sm:px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
              <h2 className="font-bold text-base text-slate-100">সাম্প্রতিক লেনদেন</h2>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => onNavigate('transactions')}
              className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 touch-manipulation"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="divide-y divide-slate-800/70 flex-1">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                কোনো লেনদেনের রেকর্ড নেই
              </div>
            ) : (
              recentLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        log.type === 'deposit'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : log.type === 'loan_issue'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      {log.type === 'deposit' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : log.type === 'loan_issue' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {log.memberName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {log.note || '-'} · {log.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-100 font-num shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};
