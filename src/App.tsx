import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  HandCoins,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  PieChart,
  RotateCcw,
  ShieldCheck,
  Trees,
  Users,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { BottomSheetModal } from './components/BottomSheetModal';
import { CampaignSettingsModal } from './components/CampaignSettingsModal';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { DashboardPage } from './components/DashboardPage';
import { MemberDetailModal } from './components/MemberDetailModal';
import { MembersSection } from './components/MembersSection';
import { ReportPage } from './components/ReportPage';
import { TransactionLogs } from './components/TransactionLogs';
import { WaterfallBackground } from './components/WaterfallBackground';
import {
  AppPage,
  CampaignConfig,
  FilterType,
  Member,
  SortType,
  STORAGE_KEYS,
  ToastState,
  TransactionLog,
} from './types/fund';
import {
  calculateCampaignStats,
  calculateMemberStatus,
  formatCurrency,
  hasConfiguredAdminPin,
  loadConfig,
  loadLogs,
  loadMembers,
  saveAdminPin,
  saveConfig,
  saveLogs,
  saveMembers,
  verifyAdminPin,
} from './utils/fundUtils';

type ConfirmAction = {
  title: string;
  description: string;
  onConfirm: () => void;
} | null;

const VALID_PAGES: AppPage[] = ['dashboard', 'categories', 'members', 'transactions', 'report'];

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'categories', label: 'বিভাগ', icon: PieChart },
  { id: 'members', label: 'সদস্য', icon: Users },
  { id: 'transactions', label: 'লেনদেন', icon: History },
  { id: 'report', label: 'রিপোর্ট', icon: FileText },
];

function getInitialPage(): AppPage {
  const hash = window.location.hash.replace('#', '') as AppPage;
  return VALID_PAGES.includes(hash) ? hash : 'dashboard';
}

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>(() => getInitialPage());
  const [config, setConfig] = useState<CampaignConfig>(() => loadConfig());
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [logs, setLogs] = useState<TransactionLog[]>(() => loadLogs());
  const [isAdmin, setIsAdmin] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState<number | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');

  // Modals & Drawers state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDeposit, setNewMemberDeposit] = useState('');

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositMemberId, setDepositMemberId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [loanActionType, setLoanActionType] = useState<'issue' | 'repay'>('issue');
  const [loanMemberId, setLoanMemberId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanNote, setLoanNote] = useState('');

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '') as AppPage;
      if (VALID_PAGES.includes(next)) {
        setActivePage(next);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (page: AppPage) => {
    setActivePage(page);
    if (window.location.hash !== `#${page}`) {
      window.history.pushState(null, '', `#${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  const stats = useMemo(
    () => calculateCampaignStats(members, config, simulatedDay),
    [members, config, simulatedDay]
  );

  const depositPresets = useMemo(() => {
    const rate = config.dailyRate;
    const total = config.totalDays * rate;
    return Array.from(new Set([rate, rate * 2, rate * 5, rate * 10, total]));
  }, [config]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = members.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(q);
      const status = calculateMemberStatus(
        member.totalDeposit,
        config,
        simulatedDay
      );

      let matchesFilter = true;
      if (statusFilter === 'cleared') matchesFilter = status.isClear;
      if (statusFilter === 'due') matchesFilter = !status.isClear;
      if (statusFilter === 'loan') matchesFilter = member.loanBalance > 0;

      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
    }
    if (sortBy === 'deposit_desc') {
      return [...list].sort((a, b) => b.totalDeposit - a.totalDeposit);
    }
    if (sortBy === 'deposit_asc') {
      return [...list].sort((a, b) => a.totalDeposit - b.totalDeposit);
    }
    if (sortBy === 'due_desc') {
      return [...list].sort(
        (a, b) =>
          calculateMemberStatus(b.totalDeposit, config, simulatedDay).short -
          calculateMemberStatus(a.totalDeposit, config, simulatedDay).short
      );
    }
    if (sortBy === 'loan_desc') {
      return [...list].sort((a, b) => b.loanBalance - a.loanBalance);
    }
    return list;
  }, [members, searchQuery, statusFilter, sortBy, config, simulatedDay]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const selectedDepositMember = useMemo(
    () => members.find((m) => m.id === depositMemberId) || null,
    [members, depositMemberId]
  );

  const selectedDepositStatus = useMemo(
    () =>
      selectedDepositMember
        ? calculateMemberStatus(
            selectedDepositMember.totalDeposit,
            config,
            simulatedDay
          )
        : null,
    [selectedDepositMember, config, simulatedDay]
  );

  const selectedLoanMember = useMemo(
    () => members.find((m) => m.id === loanMemberId),
    [members, loanMemberId]
  );

  // Admin Toggle / Auth
  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      showToast('মেম্বার ভিউতে সুইচ করা হয়েছে');
    } else {
      setAdminPasswordInput('');
      setIsAdminLoginOpen(true);
    }
  };

  const adminPinConfigured = hasConfiguredAdminPin();

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = adminPasswordInput.trim();
    if (!entered) return;

    if (!adminPinConfigured) {
      if (entered.length < 4) {
        showToast('কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন', 'error');
        return;
      }
      saveAdminPin(entered);
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setAdminPasswordInput('');
      showToast('নতুন এডমিন পাসওয়ার্ড সেট করে প্রবেশ করা হয়েছে');
      return;
    }

    if (verifyAdminPin(entered)) {
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setAdminPasswordInput('');
      showToast('এডমিন মোডে সফলভাবে প্রবেশ করা হয়েছে');
    } else {
      showToast('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন', 'error');
    }
  };

  // Campaign Settings Save
  const handleSaveConfig = (next: CampaignConfig) => {
    setConfig(next);
    showToast('ক্যাম্পেইন সেটিংস আপডেট করা হয়েছে');
  };

  // Add Member
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const name = newMemberName.trim();
    const initialDeposit = Math.max(0, Number(newMemberDeposit) || 0);
    if (!name) return;

    const newMember: Member = {
      id: `m_${Date.now()}`,
      name,
      totalDeposit: initialDeposit,
      loanBalance: 0,
    };

    setMembers((prev) => [...prev, newMember]);

    if (initialDeposit > 0) {
      setLogs((prev) => [
        {
          id: `l_${Date.now()}`,
          date: new Date().toLocaleString('bn-BD'),
          memberName: name,
          type: 'deposit',
          amount: initialDeposit,
          note: 'প্রাথমিক জমা',
        },
        ...prev,
      ]);
    }

    setNewMemberName('');
    setNewMemberDeposit('');
    setIsAddMemberOpen(false);
    showToast(`নতুন মেম্বার "${name}" যুক্ত করা হয়েছে`);
  };

  // Rename Member
  const handleRenameMember = (memberId: string, newName: string) => {
    if (!isAdmin) return;
    const oldMember = members.find((m) => m.id === memberId);
    if (!oldMember) return;
    const oldName = oldMember.name;

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, name: newName } : m))
    );
    setLogs((prev) =>
      prev.map((l) => (l.memberName === oldName ? { ...l, memberName: newName } : l))
    );
    showToast('মেম্বারের নাম আপডেট করা হয়েছে');
  };

  // Deposit
  const openDepositModal = (preselectId = '') => {
    if (!isAdmin) return;
    setDepositMemberId(preselectId || members[0]?.id || '');
    setDepositAmount('');
    setDepositNote('');
    setIsDepositOpen(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const amount = Number(depositAmount);
    if (!depositMemberId || amount <= 0) return;

    const targetMember = members.find((m) => m.id === depositMemberId);
    if (!targetMember) return;

    setMembers((prev) =>
      prev.map((m) =>
        m.id === depositMemberId ? { ...m, totalDeposit: m.totalDeposit + amount } : m
      )
    );

    setLogs((prev) => [
      {
        id: `l_${Date.now()}`,
        date: new Date().toLocaleString('bn-BD'),
        memberName: targetMember.name,
        type: 'deposit',
        amount,
        note: depositNote.trim() || 'সাধারণ জমা',
      },
      ...prev,
    ]);

    setIsDepositOpen(false);
    showToast(`${formatCurrency(amount)} "${targetMember.name}"-এর অ্যাকাউন্টে জমা হয়েছে`);
  };

  // Loan
  const openLoanModal = (preselectId = '', defaultType: 'issue' | 'repay' = 'issue') => {
    if (!isAdmin) return;
    const initialId = preselectId || members[0]?.id || '';
    const m = members.find((item) => item.id === initialId);
    const resolvedType =
      preselectId && m && m.loanBalance > 0 ? 'repay' : defaultType;

    setLoanMemberId(initialId);
    setLoanActionType(resolvedType);
    setLoanAmount('');
    setLoanNote('');
    setIsLoanOpen(true);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const amount = Number(loanAmount);
    if (!loanMemberId || amount <= 0) return;

    const targetMember = members.find((m) => m.id === loanMemberId);
    if (!targetMember) return;

    if (loanActionType === 'issue') {
      if (amount > stats.netCash) {
        showToast(
          `লোন দেওয়া সম্ভব নয়! ফান্ডে পর্যাপ্ত ক্যাশ (${formatCurrency(stats.netCash)}) নেই`,
          'error'
        );
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === loanMemberId ? { ...m, loanBalance: m.loanBalance + amount } : m
        )
      );

      setLogs((prev) => [
        {
          id: `l_${Date.now()}`,
          date: new Date().toLocaleString('bn-BD'),
          memberName: targetMember.name,
          type: 'loan_issue',
          amount,
          note: loanNote.trim() || 'ইমার্জেন্সি লোন প্রদান',
        },
        ...prev,
      ]);

      showToast(`"${targetMember.name}"-কে ${formatCurrency(amount)} লোন দেওয়া হয়েছে`);
    } else {
      if (amount > targetMember.loanBalance) {
        showToast(
          `ভুল ইনপুট! বকেয়া লোন আছে ${formatCurrency(targetMember.loanBalance)}`,
          'error'
        );
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === loanMemberId ? { ...m, loanBalance: m.loanBalance - amount } : m
        )
      );

      setLogs((prev) => [
        {
          id: `l_${Date.now()}`,
          date: new Date().toLocaleString('bn-BD'),
          memberName: targetMember.name,
          type: 'loan_repay',
          amount,
          note: loanNote.trim() || 'লোন পরিশোধ',
        },
        ...prev,
      ]);

      showToast(`"${targetMember.name}" ${formatCurrency(amount)} লোন পরিশোধ করেছেন`);
    }

    setIsLoanOpen(false);
  };

  // Delete & Reset
  const requestDeleteMember = (id: string) => {
    if (!isAdmin) return;
    const target = members.find((m) => m.id === id);
    if (!target) return;

    setConfirmAction({
      title: 'মেম্বার সরিয়ে নিতে চান?',
      description:
        target.loanBalance > 0
          ? `সতর্কতা: "${target.name}"-এর নামে ${formatCurrency(target.loanBalance)} বকেয়া লোন রয়েছে! আপনি কি তবুও তাঁকে তালিকা থেকে স্থায়ীভাবে মুছে ফেলতে চান?`
          : `আপনি কি নিশ্চিত যে "${target.name}"-কে তালিকা থেকে স্থায়ীভাবে মুছে ফেলতে চান?`,
      onConfirm: () => {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        if (selectedMemberId === id) setSelectedMemberId(null);
        setConfirmAction(null);
        showToast(`"${target.name}"-কে তালিকা থেকে মুছে ফেলা হয়েছে`);
      },
    });
  };

  const requestResetAll = () => {
    if (!isAdmin) return;
    setConfirmAction({
      title: 'সমস্ত ডাটা রিসেট করবেন?',
      description: 'আপনি কি নিশ্চিত যে সমস্ত মেম্বার ও লেনদেনের ইতিহাস মুছে ফেলতে চান?',
      onConfirm: () => {
        localStorage.removeItem(STORAGE_KEYS.MEMBERS);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        setMembers([]);
        setLogs([]);
        setSelectedMemberId(null);
        setConfirmAction(null);
        showToast('সমস্ত ডাটা মুছে ফেলা হয়েছে');
      },
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <WaterfallBackground />
        {/* Top Bar: Clean 3-Zone Contract */}
        <header className="no-print md:sticky md:top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Brand Wordmark */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 touch-manipulation"
            >
              <motion.span
                whileTap={{ rotate: [-8, 8, 0] }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0"
              >
                <Trees className="w-4 h-4" />
              </motion.span>
              <span>{config.title}</span>
            </motion.button>

            {/* Zone 2: Desktop Single-Line Navigation Links */}
            <nav
              aria-label="প্রধান নেভিগেশন"
              className="hidden md:flex items-center gap-6 text-sm font-medium"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigateTo(item.id)}
                    className={`relative py-2 whitespace-nowrap shrink-0 transition-colors touch-manipulation ${
                      isActive
                        ? 'text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-underline"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-400 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Zone 3: Single Primary Icon-Only Admin Action */}
            <div className="flex items-center shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.86 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={handleAdminToggle}
                title={isAdmin ? 'লগআউট' : 'এডমিন লগইন'}
                aria-label={isAdmin ? 'লগআউট' : 'এডমিন লগইন'}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors shrink-0 touch-manipulation overflow-hidden ${
                  isAdmin
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isAdmin ? (
                    <motion.span
                      key="logout-icon"
                      initial={{ rotate: -45, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 45, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.16 }}
                    >
                      <LogOut className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="lock-icon"
                      initial={{ rotate: 45, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -45, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.16 }}
                    >
                      <Lock className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </header>

      {/* Main Page Viewport */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-10 w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activePage === 'dashboard' && (
              <DashboardPage
                config={config}
                stats={stats}
                members={members}
                logs={logs}
                simulatedDay={simulatedDay}
                onSimulateDayChange={setSimulatedDay}
                isAdmin={isAdmin}
                onNavigate={navigateTo}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenDeposit={(id) => openDepositModal(id)}
                onOpenLoan={(id) => openLoanModal(id)}
                onSelectMember={(m) => setSelectedMemberId(m.id)}
              />
            )}

            {activePage === 'categories' && (
              <CategoryBreakdown
                config={config}
                members={members}
                passedDays={stats.passedDays}
                simulatedDay={simulatedDay}
                isAdmin={isAdmin}
                onQuickDeposit={(id) => openDepositModal(id)}
                onQuickLoan={(id) => openLoanModal(id, 'repay')}
                onSelectMember={(m) => setSelectedMemberId(m.id)}
              />
            )}

            {activePage === 'members' && (
              <MembersSection
                config={config}
                members={members}
                filteredMembers={filteredMembers}
                simulatedDay={simulatedDay}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                isAdmin={isAdmin}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenDeposit={() => openDepositModal()}
                onOpenLoan={() => openLoanModal()}
                onQuickDeposit={(id) => openDepositModal(id)}
                onQuickLoan={(id) => openLoanModal(id)}
                onDeleteMember={requestDeleteMember}
                onResetAll={requestResetAll}
                onSelectMember={(m) => setSelectedMemberId(m.id)}
              />
            )}

            {activePage === 'transactions' && <TransactionLogs logs={logs} />}

            {activePage === 'report' && (
              <ReportPage
                config={config}
                stats={stats}
                members={members}
                logs={logs}
                simulatedDay={simulatedDay}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Fixed Thumb-Zone Bottom Navigation Bar (< md) — Icon Only */}
      <nav
        aria-label="মোবাইল ন্যাভিগেশন"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.84 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={() => navigateTo(item.id)}
                title={item.label}
                aria-label={item.label}
                className={`relative min-h-[44px] flex items-center justify-center rounded-xl transition-colors touch-manipulation ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-x-2 inset-y-1 bg-emerald-500/15 border border-emerald-500/25 rounded-xl -z-10"
                  />
                )}
                <motion.span
                  animate={{ scale: isActive ? 1.16 : 1, y: isActive ? -1.5 : 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                >
                  <Icon className="w-[22px] h-[22px]" />
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className={`no-print fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <XCircle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Detail Inspector Modal */}
      <MemberDetailModal
        member={selectedMember}
        config={config}
        logs={logs}
        simulatedDay={simulatedDay}
        isAdmin={isAdmin}
        onClose={() => setSelectedMemberId(null)}
        onRenameMember={handleRenameMember}
        onQuickDeposit={(id) => openDepositModal(id)}
        onQuickLoan={(id) => openLoanModal(id)}
        onDeleteMember={requestDeleteMember}
      />

      {/* Campaign Settings Modal */}
      <CampaignSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* MODAL: Admin Login */}
      <BottomSheetModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        title={adminPinConfigured ? 'এডমিন লগইন' : 'এডমিন পাসওয়ার্ড সেট করুন'}
        maxWidthClass="sm:max-w-sm"
      >
        <form onSubmit={handleAdminLoginSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400">
              {adminPinConfigured
                ? 'এডমিন প্যানেলে প্রবেশের জন্য পাসওয়ার্ড দিন'
                : 'প্রথমবার ব্যবহারের জন্য একটি এডমিন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর) সেট করুন'}
            </p>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              পাসওয়ার্ড *
            </label>
            <input
              id="admin-password"
              type="password"
              inputMode="numeric"
              autoFocus
              required
              minLength={4}
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              placeholder={
                adminPinConfigured ? 'পাসওয়ার্ড দিন...' : 'নতুন পাসওয়ার্ড লিখুন...'
              }
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-center tracking-widest text-lg font-num"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(false)}
              className="min-h-[48px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="min-h-[48px] py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 touch-manipulation"
            >
              <KeyRound className="w-4 h-4" />
              <span>{adminPinConfigured ? 'লগইন' : 'সেট ও লগইন'}</span>
            </button>
          </div>
        </form>
      </BottomSheetModal>

      {/* MODAL: Add Member */}
      <BottomSheetModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="নতুন মেম্বার যুক্ত করুন"
      >
        <form onSubmit={handleAddMemberSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="new-member-name"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              মেম্বারের নাম *
            </label>
            <input
              id="new-member-name"
              type="text"
              required
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="মেম্বারের নাম লিখুন..."
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="new-member-deposit"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              প্রাথমিক জমা (ঐচ্ছিক)
            </label>
            <input
              id="new-member-deposit"
              type="number"
              inputMode="numeric"
              min="0"
              value={newMemberDeposit}
              onChange={(e) => setNewMemberDeposit(e.target.value)}
              placeholder="0"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-num"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddMemberOpen(false)}
              className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              মেম্বার যোগ করুন
            </button>
          </div>
        </form>
      </BottomSheetModal>

      {/* MODAL: Deposit */}
      <BottomSheetModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        title="ফান্ডে জমা যোগ করুন"
      >
        <form onSubmit={handleDepositSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="deposit-member-select"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              মেম্বার সিলেক্ট করুন *
            </label>
            <select
              id="deposit-member-select"
              required
              value={depositMemberId}
              onChange={(e) => setDepositMemberId(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="">মেম্বার বাছাই করুন</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (বর্তমান জমা: {formatCurrency(m.totalDeposit)})
                </option>
              ))}
            </select>
            {selectedDepositMember && selectedDepositStatus && (
              <div className="mt-2 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 font-num">
                  জমা: <strong className="text-emerald-400">{formatCurrency(selectedDepositMember.totalDeposit)}</strong>
                </span>
                {selectedDepositStatus.short > 0 ? (
                  <span className="text-rose-400 font-semibold font-num">
                    আজকের বকেয়া: {formatCurrency(selectedDepositStatus.short)}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    আজ পর্যন্ত ক্লিয়ার
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="deposit-amount"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              জমার পরিমাণ (টাকা) *
            </label>
            <input
              id="deposit-amount"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="যেমন: 20, 100, 500"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-base font-num"
            />
            {selectedDepositStatus &&
              (selectedDepositStatus.short > 0 ||
                selectedDepositStatus.remainingToFullTarget > 0) && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {selectedDepositStatus.short > 0 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      onClick={() =>
                        setDepositAmount(String(selectedDepositStatus.short))
                      }
                      className="min-h-[36px] px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold font-num transition-colors touch-manipulation"
                    >
                      আজকের বকেয়া ({formatCurrency(selectedDepositStatus.short)})
                    </motion.button>
                  )}
                  {selectedDepositStatus.remainingToFullTarget > 0 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      onClick={() =>
                        setDepositAmount(
                          String(selectedDepositStatus.remainingToFullTarget)
                        )
                      }
                      className="min-h-[36px] px-3 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-semibold font-num transition-colors touch-manipulation"
                    >
                      পূর্ণ টার্গেট বাকি ({formatCurrency(selectedDepositStatus.remainingToFullTarget)})
                    </motion.button>
                  )}
                </div>
              )}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
              {depositPresets.map((preset) => (
                <motion.button
                  key={preset}
                  type="button"
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setDepositAmount(String(preset))}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold font-num border transition shrink-0 touch-manipulation ${
                    Number(depositAmount) === preset
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  +{formatCurrency(preset)}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="deposit-note"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              নোট / বিবরণ (ঐচ্ছিক)
            </label>
            <input
              id="deposit-note"
              type="text"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              placeholder="যেমন: ৫ দিনের আগাম জমা"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDepositOpen(false)}
              className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              জমা কনফার্ম করুন
            </button>
          </div>
        </form>
      </BottomSheetModal>

      {/* MODAL: Emergency Loan Management */}
      <BottomSheetModal
        isOpen={isLoanOpen}
        onClose={() => setIsLoanOpen(false)}
        title="ইমার্জেন্সি লোন ম্যানেজমেন্ট"
      >
        <form onSubmit={handleLoanSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              অ্যাকশন টাইপ *
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setLoanActionType('issue')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 touch-manipulation ${
                  loanActionType === 'issue'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HandCoins className="w-4 h-4" />
                <span>নতুন লোন</span>
              </button>
              <button
                type="button"
                onClick={() => setLoanActionType('repay')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 touch-manipulation ${
                  loanActionType === 'repay'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>লোন পরিশোধ</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="loan-member-select"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              মেম্বার সিলেক্ট করুন *
            </label>
            <select
              id="loan-member-select"
              required
              value={loanMemberId}
              onChange={(e) => setLoanMemberId(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
            >
              <option value="">মেম্বার বাছাই করুন</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (বকেয়া লোন: {formatCurrency(m.loanBalance)})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
              {loanActionType === 'issue'
                ? `ফান্ডে অবশিষ্ট ক্যাশ: ${formatCurrency(stats.netCash)}`
                : `নির্বাচিত মেম্বারের বকেয়া: ${formatCurrency(selectedLoanMember?.loanBalance || 0)}`}
            </p>
          </div>

          <div>
            <label
              htmlFor="loan-amount"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              টাকার পরিমাণ *
            </label>
            <input
              id="loan-amount"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="যেমন: 500"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-base font-num"
            />
            {loanActionType === 'repay' &&
              selectedLoanMember &&
              selectedLoanMember.loanBalance > 0 && (
                <div className="pt-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() =>
                      setLoanAmount(String(selectedLoanMember.loanBalance))
                    }
                    className="min-h-[36px] px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold font-num transition-colors touch-manipulation"
                  >
                    সম্পূর্ণ পরিশোধ ({formatCurrency(selectedLoanMember.loanBalance)})
                  </motion.button>
                </div>
              )}
          </div>

          <div>
            <label
              htmlFor="loan-note"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              কারণ / নোট (ঐচ্ছিক)
            </label>
            <input
              id="loan-note"
              type="text"
              value={loanNote}
              onChange={(e) => setLoanNote(e.target.value)}
              placeholder="যেমন: জরুরি কাজ / লোন পরিশোধ"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLoanOpen(false)}
              className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-sm font-semibold rounded-xl transition touch-manipulation"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className={`min-h-[48px] px-4 py-2.5 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition touch-manipulation ${
                loanActionType === 'issue'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {loanActionType === 'issue' ? 'লোন প্রসেস করুন' : 'পরিশোধ জমা নিন'}
            </button>
          </div>
        </form>
      </BottomSheetModal>

      {/* MODAL: Confirm Delete / Reset */}
      <BottomSheetModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        hideHeader
        maxWidthClass="sm:max-w-sm"
      >
        {confirmAction && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-100">
              {confirmAction.title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {confirmAction.description}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="min-h-[48px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-xs font-semibold rounded-xl transition touch-manipulation"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmAction.onConfirm}
                className="min-h-[48px] px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition touch-manipulation"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        )}
      </BottomSheetModal>
    </div>
    </MotionConfig>
  );
}
