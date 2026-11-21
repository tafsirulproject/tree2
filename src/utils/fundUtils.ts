import {
  CampaignConfig,
  CampaignStats,
  DEFAULT_CAMPAIGN_CONFIG,
  Member,
  MemberStatus,
  STORAGE_KEYS,
  TransactionLog,
} from '../types/fund';

function toLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getPassedDaysInfo(
  config: CampaignConfig,
  overrideDay?: number | null
): {
  passedDays: number;
  daysRemaining: number;
  daysUntilStart: number;
  isBeforeStart: boolean;
} {
  if (typeof overrideDay === 'number' && overrideDay >= 1) {
    const clamped = Math.min(Math.max(Math.round(overrideDay), 1), config.totalDays);
    return {
      passedDays: clamped,
      daysRemaining: Math.max(0, config.totalDays - clamped),
      daysUntilStart: 0,
      isBeforeStart: false,
    };
  }

  const todayMidnight = toLocalMidnight(new Date());
  const parts = config.startDate.split('-').map(Number);
  const startMidnight =
    parts.length === 3 && !parts.some(Number.isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : toLocalMidnight(new Date());

  const diffDays = Math.round(
    (todayMidnight.getTime() - startMidnight.getTime()) / 86400000
  );

  if (diffDays < 0) {
    return {
      passedDays: 0,
      daysRemaining: config.totalDays,
      daysUntilStart: Math.abs(diffDays),
      isBeforeStart: true,
    };
  }

  const currentDay = Math.min(diffDays + 1, config.totalDays);
  return {
    passedDays: currentDay,
    daysRemaining: Math.max(0, config.totalDays - currentDay),
    daysUntilStart: 0,
    isBeforeStart: false,
  };
}

export function getPassedDaysCount(
  config: CampaignConfig,
  overrideDay?: number | null
): number {
  return getPassedDaysInfo(config, overrideDay).passedDays;
}

export function getCampaignEndDateLabel(config: CampaignConfig): string {
  const parts = config.startDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return '';
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  const end = new Date(start);
  end.setDate(end.getDate() + config.totalDays);
  const fmt = new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function calculateMemberStatus(
  totalDeposit: number,
  config: CampaignConfig,
  overrideDay?: number | null
): MemberStatus {
  const safeDeposit = Math.max(0, Number(totalDeposit) || 0);
  const passedDays = getPassedDaysCount(config, overrideDay);
  const currentRequired = passedDays * config.dailyRate;
  const totalTarget = config.totalDays * config.dailyRate;
  const clearedDays =
    config.dailyRate > 0 ? Math.floor(safeDeposit / config.dailyRate) : 0;
  const targetPercent =
    totalTarget > 0 ? Math.min(Math.round((safeDeposit / totalTarget) * 100), 100) : 0;
  const remainingToFullTarget = Math.max(0, totalTarget - safeDeposit);

  if (safeDeposit >= currentRequired) {
    return {
      isClear: true,
      days: clearedDays,
      advanceDays: Math.max(0, clearedDays - passedDays),
      short: 0,
      currentRequired,
      remainingToFullTarget,
      targetPercent,
    };
  }

  return {
    isClear: false,
    days: clearedDays,
    advanceDays: 0,
    short: currentRequired - safeDeposit,
    currentRequired,
    remainingToFullTarget,
    targetPercent,
  };
}

export function calculateCampaignStats(
  members: Member[],
  config: CampaignConfig,
  overrideDay?: number | null
): CampaignStats {
  const { passedDays, daysRemaining, daysUntilStart, isBeforeStart } =
    getPassedDaysInfo(config, overrideDay);

  const totalTargetPerPerson = config.totalDays * config.dailyRate;
  const todayRequiredPerPerson = passedDays * config.dailyRate;

  let totalDeposit = 0;
  let totalLoan = 0;
  let todayCollectedCapped = 0;
  let overallCappedDeposit = 0;
  let totalDueToday = 0;
  let clearCount = 0;
  let dueCount = 0;
  let loanHolderCount = 0;

  for (const member of members) {
    const dep = Math.max(0, Number(member.totalDeposit) || 0);
    const loan = Math.max(0, Number(member.loanBalance) || 0);

    totalDeposit += dep;
    totalLoan += loan;
    todayCollectedCapped += Math.min(dep, todayRequiredPerPerson);
    overallCappedDeposit += Math.min(dep, totalTargetPerPerson);

    if (loan > 0) loanHolderCount += 1;

    if (dep >= todayRequiredPerPerson) {
      clearCount += 1;
    } else {
      dueCount += 1;
      totalDueToday += todayRequiredPerPerson - dep;
    }
  }

  const netCash = totalDeposit - totalLoan;
  const totalTargetAmount = members.length * totalTargetPerPerson;
  const todayExpectedTotal = members.length * todayRequiredPerPerson;

  const todayCollectionPercent =
    todayExpectedTotal > 0
      ? Math.min(Math.round((todayCollectedCapped / todayExpectedTotal) * 100), 100)
      : members.length > 0 && isBeforeStart
      ? 100
      : 0;

  const overallProgressPercent =
    totalTargetAmount > 0
      ? Math.min(Math.round((overallCappedDeposit / totalTargetAmount) * 100), 100)
      : 0;

  return {
    passedDays,
    daysRemaining,
    daysUntilStart,
    isBeforeStart,
    totalDeposit,
    totalLoan,
    netCash,
    totalTargetPerPerson,
    totalTargetAmount,
    todayRequiredPerPerson,
    todayExpectedTotal,
    todayCollectedCapped,
    todayCollectionPercent,
    overallCappedDeposit,
    overallProgressPercent,
    totalDueToday,
    clearCount,
    dueCount,
    loanHolderCount,
  };
}

export function formatBnNumber(num: number): string {
  return Number(num || 0).toLocaleString('bn-BD');
}

export function formatCurrency(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString('bn-BD')}`;
}

export function loadConfig(): CampaignConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CAMPAIGN_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      title:
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title
          : DEFAULT_CAMPAIGN_CONFIG.title,
      dailyRate:
        Number(parsed.dailyRate) > 0
          ? Number(parsed.dailyRate)
          : DEFAULT_CAMPAIGN_CONFIG.dailyRate,
      startDate:
        typeof parsed.startDate === 'string' && parsed.startDate
          ? parsed.startDate
          : DEFAULT_CAMPAIGN_CONFIG.startDate,
      totalDays:
        Number(parsed.totalDays) > 0
          ? Number(parsed.totalDays)
          : DEFAULT_CAMPAIGN_CONFIG.totalDays,
    };
  } catch {
    return DEFAULT_CAMPAIGN_CONFIG;
  }
}

export function saveConfig(config: CampaignConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {
    // Storage unavailable
  }
}

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMembers(members: Member[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch {
    // Storage unavailable
  }
}

export function loadLogs(): TransactionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: TransactionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch {
    // Storage unavailable
  }
}

function getEnvAdminPin(): string {
  try {
    const val = (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_ADMIN_PASSWORD;
    return typeof val === 'string' ? val.trim() : '';
  } catch {
    return '';
  }
}

export function hasConfiguredAdminPin(): boolean {
  if (getEnvAdminPin()) return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    return Boolean(saved && saved.trim());
  } catch {
    return false;
  }
}

export function saveAdminPin(pin: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin.trim());
  } catch {
    // Storage unavailable
  }
}

export function verifyAdminPin(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const envPin = getEnvAdminPin();
  if (envPin) return trimmed === envPin;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    return Boolean(saved && trimmed === saved.trim());
  } catch {
    return false;
  }
}
