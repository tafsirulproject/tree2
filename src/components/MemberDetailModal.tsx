import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Coins,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CampaignConfig, Member, TransactionLog } from '../types/fund';
import {
  calculateMemberStatus,
  formatBnNumber,
  formatCurrency,
} from '../utils/fundUtils';
import { BottomSheetModal } from './BottomSheetModal';

interface MemberDetailModalProps {
  member: Member | null;
  config: CampaignConfig;
  logs: TransactionLog[];
  simulatedDay?: number | null;
  isAdmin: boolean;
  onClose: () => void;
  onRenameMember: (memberId: string, newName: string) => void;
  onQuickDeposit: (memberId: string) => void;
  onQuickLoan: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  config,
  logs,
  simulatedDay = null,
  isAdmin,
  onClose,
  onRenameMember,
  onQuickDeposit,
  onQuickLoan,
  onDeleteMember,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (member) {
      setNameDraft(member.name);
      setIsEditingName(false);
    }
  }, [member]);

  if (!member) return null;

  const status = calculateMemberStatus(member.totalDeposit, config, simulatedDay);
  const totalTarget = config.totalDays * config.dailyRate;
  const memberLogs = logs.filter((l) => l.memberName === member.name);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    onRenameMember(member.id, trimmed);
    setIsEditingName(false);
  };

  return (
    <BottomSheetModal
      isOpen={Boolean(member)}
      onClose={onClose}
      title="মেম্বার প্রোফাইল ও হিসাব"
      maxWidthClass="sm:max-w-lg"
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* Name & Edit Row */}
        <div className="flex items-start justify-between gap-3">
          {isEditingName && isAdmin ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2 flex-1">
              <input
                type="text"
                autoFocus
                required
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 min-h-[44px] px-3.5 py-2 bg-slate-950 border border-emerald-500 rounded-xl text-sm text-slate-100 focus:outline-none"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.92 }}
                aria-label="নাম সংরক্ষণ করুন"
                className="min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center touch-manipulation"
              >
                <Check className="w-4 h-4" />
              </motion.button>
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg sm:text-xl font-bold text-slate-100 truncate">
                  {member.name}
                </h4>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    aria-label="নাম পরিবর্তন করুন"
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition touch-manipulation"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-1">
                {status.isClear ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {formatBnNumber(status.days)} দিন Clear
                    {status.advanceDays > 0
                      ? ` (${formatBnNumber(status.advanceDays)} দিন অগ্রিম)`
                      : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                    <XCircle className="w-4 h-4 shrink-0" />
                    বকেয়া {formatCurrency(status.short)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <p className="text-[11px] text-slate-400">মোট জমা</p>
            <p className="text-base sm:text-lg font-bold text-emerald-400 font-num mt-0.5">
              {formatCurrency(member.totalDeposit)}
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <p className="text-[11px] text-slate-400">টার্গেট</p>
            <p className="text-base sm:text-lg font-bold text-teal-400 font-num mt-0.5">
              {formatCurrency(totalTarget)}
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <p className="text-[11px] text-slate-400">বকেয়া লোন</p>
            <p
              className={`text-base sm:text-lg font-bold font-num mt-0.5 ${
                member.loanBalance > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {formatCurrency(member.loanBalance)}
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>ব্যক্তিগত টার্গেট পূর্ণতা</span>
            <span className="font-semibold text-emerald-400 font-num">
              {formatBnNumber(status.targetPercent)}% ({formatBnNumber(status.days)}/
              {formatBnNumber(config.totalDays)} দিন)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: status.targetPercent / 100 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: 0 }}
              className={`h-full w-full rounded-full ${
                status.isClear ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </div>
          {status.remainingToFullTarget > 0 && (
            <p className="text-[11px] text-slate-400 font-num text-right">
              পূর্ণ টার্গেট পূরণে বাকি: {formatCurrency(status.remainingToFullTarget)}
            </p>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                onClose();
                onQuickDeposit(member.id);
              }}
              className="min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              <span>জমা যোগ</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                onClose();
                onQuickLoan(member.id);
              }}
              className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Coins className="w-4 h-4" />
              <span>লোন</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                onClose();
                onDeleteMember(member.id);
              }}
              className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
              <span>মুছুন</span>
            </motion.button>
          </div>
        )}

        {/* Member Personal Transaction History */}
        <div className="space-y-2 pt-1">
          <h5 className="text-xs font-semibold text-slate-400">
            ব্যক্তিগত লেনদেনের ইতিহাস ({formatBnNumber(memberLogs.length)})
          </h5>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800/70 max-h-48 overflow-y-auto overscroll-contain">
            {memberLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-5">
                কোনো লেনদেন পাওয়া যায়নি
              </p>
            ) : (
              memberLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {log.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : log.type === 'loan_issue' ? (
                      <ArrowUpRight className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium truncate">
                        {log.note || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {log.date}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-100 font-num shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
};
