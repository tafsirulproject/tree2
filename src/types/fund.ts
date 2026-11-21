function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  title: 'Tree',
  dailyRate: 20,
  startDate: getTodayIsoDate(),
  totalDays: 30,
};

export const STORAGE_KEYS = {
  MEMBERS: 'tour_members_db',
  LOGS: 'tour_logs_db',
  CONFIG: 'tour_campaign_config',
  ADMIN_PIN: 'tour_admin_pin',
} as const;

export type AppPage = 'dashboard' | 'categories' | 'members' | 'transactions' | 'report';

export interface CampaignConfig {
  title: string;
  dailyRate: number;
  startDate: string; // YYYY-MM-DD
  totalDays: number;
}

export interface Member {
  id: string;
  name: string;
  totalDeposit: number;
  loanBalance: number;
}

export type TransactionType = 'deposit' | 'loan_issue' | 'loan_repay';

export interface TransactionLog {
  id: string;
  date: string;
  memberName: string;
  type: TransactionType;
  amount: number;
  note: string;
}

export interface MemberStatus {
  isClear: boolean;
  days: number;
  advanceDays: number;
  short: number;
  currentRequired: number;
  remainingToFullTarget: number;
  targetPercent: number;
}

export interface CampaignStats {
  passedDays: number;
  daysRemaining: number;
  daysUntilStart: number;
  isBeforeStart: boolean;
  totalDeposit: number;
  totalLoan: number;
  netCash: number;
  totalTargetPerPerson: number;
  totalTargetAmount: number;
  todayRequiredPerPerson: number;
  todayExpectedTotal: number;
  todayCollectedCapped: number;
  todayCollectionPercent: number;
  overallCappedDeposit: number;
  overallProgressPercent: number;
  totalDueToday: number;
  clearCount: number;
  dueCount: number;
  loanHolderCount: number;
}

export type FilterType = 'all' | 'cleared' | 'due' | 'loan';
export type SortType = 'default' | 'name' | 'deposit_desc' | 'deposit_asc' | 'due_desc' | 'loan_desc';
export type CategoryTab = 'clear' | 'due' | 'loan';
export type LogFilterType = 'all' | TransactionType;

export interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}
