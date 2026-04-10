import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuChartNoAxesCombined,
  LuPiggyBank,
  LuRefreshCcw,
  LuWalletCards,
} from 'react-icons/lu';
import DashboardLayout from '../../components/layout/DashboardLayout';
import NeonTopBar from '../../components/Dashboard/NeonTopBar';
import DarkCashFlowChart from '../../components/Dashboard/DarkCashFlowChart';
import DarkRecentTransactions from '../../components/Dashboard/DarkRecentTransactions';
import DarkSpendingChart from '../../components/Dashboard/DarkSpendingChart';
import DarkIncomeChart from '../../components/Dashboard/DarkIncomeChart';
import DarkGoalsWidget from '../../components/Dashboard/DarkGoalsWidget';
import DarkRecurringWidget from '../../components/Dashboard/DarkRecurringWidget';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useUserAuth } from '../../hooks/useUserAuth';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const { user, prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { format } = useCurrency();
  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Y');

  const formatDayLabel = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const formatMonthLabel = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA(selectedPeriod));
        if (active) setDashboardData(data || null);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedPeriod]);

  const pct = (value, total) => {
    if (!total) return 0;
    return Math.round((Number(value || 0) / Number(total || 0)) * 100);
  };

  const statCards = [
    {
      title: tt('dashboard.totalBalance', 'NET BALANCE'),
      amount: format(dashboardData?.totalBalance || 0),
      subtitle: tt('dashboard.acrossAccounts', 'Across all tracked accounts'),
      badgeText: `${pct(dashboardData?.totalExpenses, dashboardData?.totalIncome)}% ${tt('dashboard.expenseRatio', 'expense ratio')}`,
      accent: 'text-[#8b5cf6]',
      badgeClass: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
      glow: 'from-[#8b5cf6]/20 to-transparent',
      icon: LuWalletCards,
    },
    {
      title: tt('dashboard.totalIncome', 'TOTAL INCOME'),
      amount: format(dashboardData?.totalIncome || 0),
      subtitle: tt(`dashboard.period.${selectedPeriod}`, selectedPeriod),
      badgeText: `${format(dashboardData?.prevPeriodIncome || 0)} ${tt('dashboard.previous', 'previous')}`,
      accent: isDark ? 'text-[#d9ff34]' : 'text-[#84cc16]',
      badgeClass: isDark ? 'bg-[#d9ff34]/10 text-[#d9ff34]' : 'bg-[#84cc16]/10 text-[#84cc16]',
      glow: isDark ? 'from-[#d9ff34]/20 to-transparent' : 'from-[#84cc16]/20 to-transparent',
      icon: LuArrowUpRight,
    },
    {
      title: tt('dashboard.totalExpenses', 'TOTAL EXPENSES'),
      amount: format(dashboardData?.totalExpenses || 0),
      subtitle: tt(`dashboard.period.${selectedPeriod}`, selectedPeriod),
      badgeText: `${format(dashboardData?.prevPeriodExpenses || 0)} ${tt('dashboard.previous', 'previous')}`,
      accent: 'text-[#fb7185]',
      badgeClass: 'bg-[#fb7185]/10 text-[#fb7185]',
      glow: 'from-[#fb7185]/20 to-transparent',
      icon: LuArrowDownRight,
    },
  ];

  const cashFlowData = useMemo(() => {
    const incomeTransactions = dashboardData?.periodData?.income?.transactions || [];
    const expenseTransactions = dashboardData?.periodData?.expense?.transactions || [];
    const useMonthlyBuckets = selectedPeriod === 'Q' || selectedPeriod === 'Y';
    const buckets = new Map();
    const now = new Date();
    const periodCount = useMonthlyBuckets ? (selectedPeriod === 'Y' ? 12 : 3) : (selectedPeriod === 'W' ? 7 : 30);

    const makeDateKey = (date) =>
      useMonthlyBuckets
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const makeDateLabel = (date) =>
      useMonthlyBuckets ? formatMonthLabel(date) : formatDayLabel(date);

    const addEmptyBucket = (date) => {
      const key = makeDateKey(date);
      if (buckets.has(key)) return;
      buckets.set(key, {
        date: new Date(date),
        label: makeDateLabel(date),
        income: 0,
        expense: 0,
      });
    };

    if (useMonthlyBuckets) {
      const start = new Date(now.getFullYear(), now.getMonth() - (periodCount - 1), 1);
      for (let i = 0; i < periodCount; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
        addEmptyBucket(date);
      }
    } else {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (periodCount - 1));
      for (let i = 0; i < periodCount; i += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        addEmptyBucket(date);
      }
    }

    const addToBucket = (txn, type) => {
      const date = new Date(txn.date);
      if (Number.isNaN(date.getTime())) return;

      const key = makeDateKey(date);
      if (!buckets.has(key)) {
        const bucketDate = useMonthlyBuckets
          ? new Date(date.getFullYear(), date.getMonth(), 1)
          : new Date(date.getFullYear(), date.getMonth(), date.getDate());
        buckets.set(key, {
          date: bucketDate,
          label: makeDateLabel(bucketDate),
          income: 0,
          expense: 0,
        });
      }

      buckets.get(key)[type] += Number(txn.amount || 0);
    };

    incomeTransactions.forEach((transaction) => addToBucket(transaction, 'income'));
    expenseTransactions.forEach((transaction) => addToBucket(transaction, 'expense'));

    return [...buckets.values()]
      .sort((a, b) => a.date - b.date)
      .map((bucket) => ({
        date: bucket.label,
        income: Math.round(bucket.income),
        expense: Math.round(bucket.expense),
      }));
  }, [dashboardData, selectedPeriod]);

  const quickActions = [
    {
      title: 'Add income',
      subtitle: 'Capture a new earning source',
      icon: LuArrowUpRight,
      color: isDark ? 'text-[#d9ff34]' : 'text-[#84cc16]',
      bg: isDark ? 'bg-[#202814]' : 'bg-[#84cc16]/10',
      action: () => navigate('/income'),
    },
    {
      title: 'Add expense',
      subtitle: 'Track outgoing cash quickly',
      icon: LuArrowDownRight,
      color: 'text-[#fb7185]',
      bg: isDark ? 'bg-[#29161c]' : 'bg-[#ffe3e8]',
      action: () => navigate('/expense'),
    },
    {
      title: 'Savings goals',
      subtitle: 'Review jars and funding progress',
      icon: LuPiggyBank,
      color: 'text-[#8b5cf6]',
      bg: isDark ? 'bg-[#21182f]' : 'bg-[#efe8ff]',
      action: () => navigate('/savings'),
    },
    {
      title: 'Recurring rules',
      subtitle: 'Pause or tune subscriptions',
      icon: LuRefreshCcw,
      color: 'text-[#f59e0b]',
      bg: isDark ? 'bg-[#2f2214]' : 'bg-[#fff0d8]',
      action: () => navigate('/recurring'),
    },
  ];

  const mappedGoals = (dashboardData?.goals?.items || []).slice(0, 3).map((goal) => ({
    name: goal.title,
    progress: Math.round(goal.progress || 0),
  }));

  const recurringColors = ['#a3e635', '#9b51e0', '#38bdf8', '#fb7185', '#f59e0b'];
  const mappedRecurring = (dashboardData?.recurring?.items || [])
    .filter((rule) => rule.isActive)
    .slice(0, 4)
    .map((rule, index) => ({
      name: rule.source || rule.category || rule.type || 'Recurring',
      amount: Number(rule.amount || 0),
      color: recurringColors[index % recurringColors.length],
      repeat: rule.repeat || 'monthly',
    }));

  const spendingData = dashboardData?.spendingByCategory || [];
  const incomeData = useMemo(() => {
    const transactions = dashboardData?.periodData?.income?.transactions || [];
    const totals = new Map();

    transactions.forEach((txn) => {
      const category = String(txn.categoryName || txn.category || txn.source || 'Uncategorized').trim() || 'Uncategorized';
      totals.set(category, (totals.get(category) || 0) + Number(txn.amount || 0));
    });

    const colors = ['#d9ff34', '#8b5cf6', '#38bdf8', '#f59e0b', '#fb7185', '#22d3ee', '#a855f7'];
    return [...totals.entries()]
      .map(([name, total], index) => ({
        name,
        total,
        value: 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.total - a.total)
      .map((item, index, arr) => {
        const total = arr.reduce((sum, row) => sum + row.total, 0) || 1;
        return {
          ...item,
          value: Math.round((item.total / total) * 100),
        };
      });
  }, [dashboardData]);
  const pageClass = isDark
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(71,215,255,0.08),transparent_22%),linear-gradient(180deg,#090b11_0%,#05070b_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),transparent_20%),linear-gradient(180deg,#fefbf8_0%,#f6faee_100%)] text-[#11131b]';
  const panelClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#11131b] shadow-[0_24px_90px_rgba(15,23,42,0.08)] ring-1 ring-white/45 backdrop-blur-3xl';
  const topCardClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#11131b] shadow-[0_24px_90px_rgba(15,23,42,0.08)] ring-1 ring-white/45 backdrop-blur-3xl';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${pageClass}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -left-20 top-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-[#d9ff34]/10' : 'bg-[#d9ff34]/18'}`} />
          <div className={`absolute right-6 top-40 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-[#8b5cf6]/10' : 'bg-[#8b5cf6]/12'}`} />
          <div className={`absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full blur-3xl ${isDark ? 'bg-[#47d7ff]/8' : 'bg-white/50'}`} />
        </div>
        <div className="relative mx-auto flex max-w-[1320px] flex-col gap-4 p-4 pt-4 md:p-5 md:pt-6">
          <NeonTopBar
            title="DASHBOARD"
            subtitle={`Overview for ${user?.fullName?.split(' ')[0] || user?.username || 'User'}`}
            userName={user?.fullName?.split(' ')[0] || user?.username}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onAddTransaction={() => navigate('/expense')}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className={`relative overflow-hidden rounded-[24px] border p-6 ${topCardClass}`}
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-radial ${card.glow} blur-3xl opacity-80`} />
                  <div className={`pointer-events-none absolute inset-0 ${isDark ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent)]' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.26),transparent_36%,transparent)]'}`} />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`text-[11px] font-bold uppercase tracking-[0.24em] ${labelText}`}>{card.title}</div>
                        <div className={`mt-3 text-[34px] font-black leading-none tracking-[-0.04em] ${card.accent}`}>
                          {card.amount}
                        </div>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-[rgba(17,19,27,0.04)]'}`}>
                        <Icon className={`text-xl ${card.accent}`} />
                      </div>
                    </div>

                    <div className={`mt-3 text-xs md:text-sm ${mutedText}`}>{card.subtitle}</div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${card.badgeClass}`}>
                        {card.badgeText}
                      </span>
                      <span className={`text-[11px] font-semibold ${mutedText}`}>Updated now</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
            <div className="grid grid-cols-1 gap-4">
              <DarkCashFlowChart data={cashFlowData} valueFormatter={(value) => format(value)} />

              <div className={`rounded-[24px] border p-6 ${panelClass}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Quick Actions</h2>
                    <p className={`mt-1 text-xs md:text-sm ${mutedText}`}>Common workflows, one tap away.</p>
                  </div>
                  <LuWalletCards className={`text-xl ${labelText}`} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={item.action}
                        className={`flex items-start gap-3 rounded-[20px] border p-4 text-left transition-all backdrop-blur-2xl ${
                          isDark
                            ? 'border-white/10 bg-white/[0.05] hover:bg-white/[0.08]'
                            : 'border-white/28 bg-white/28 hover:bg-white/42'
                        }`}
                      >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}>
                            <Icon className={`text-lg ${item.color}`} />
                          </div>
                          <div>
                          <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{item.title}</div>
                          <div className={`mt-1 text-xs md:text-sm ${mutedText}`}>{item.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DarkRecentTransactions
              transactions={dashboardData?.recentTransactions || []}
              onSeeAll={() => navigate('/expense')}
              formatAmount={(amount, type) => `${type === 'income' ? '+' : '-'}${format(Math.abs(Number(amount || 0)))}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DarkSpendingChart data={spendingData} format={format} />
            <DarkIncomeChart data={incomeData} format={format} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={`rounded-[24px] border p-5 ${panelClass}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-[12px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Focus Metrics</h3>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-3xl ${isDark ? 'border-white/10 bg-white/[0.05] text-[#d0d3e4] hover:bg-white/[0.08]' : 'border-white/28 bg-white/28 text-[#31374a] hover:bg-white/42'}`}
                >
                  Refresh View
                </button>
              </div>

              <div className="space-y-3">
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/28 bg-white/28 backdrop-blur-3xl'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('dashboard.last60DaysIncome', 'Last 60 days income')}
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#d9ff34]">{format(dashboardData?.last60DaysIncome?.total || 0)}</div>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/28 bg-white/28 backdrop-blur-3xl'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Recurring monthly</div>
                  <div className="mt-2 text-2xl font-black text-[#fb7185]">{format(dashboardData?.recurring?.monthlyTotal || 0)}</div>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/28 bg-white/28 backdrop-blur-3xl'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Active goals</div>
                  <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                    {dashboardData?.goals?.active ?? dashboardData?.goals?.total ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <DarkRecurringWidget recurring={mappedRecurring} totalAmount={dashboardData?.recurring?.monthlyTotal || 0} format={format} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DarkGoalsWidget goals={mappedGoals} totalGoals={dashboardData?.goals?.active ?? dashboardData?.goals?.total ?? 0} />

            <div className={`rounded-[24px] border p-6 ${panelClass}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-[12px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>System Status</h3>
                <LuChartNoAxesCombined className={`text-lg ${labelText}`} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/28 bg-white/28 backdrop-blur-3xl'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Budget signal</div>
                  <div className="mt-2 text-lg font-black text-[#47d7ff]">
                    {dashboardData?.totalBalance >= 0 ? 'Healthy' : 'Watchlist'}
                  </div>
                  <p className={`mt-1 text-xs md:text-sm ${mutedText}`}>Based on current total balance versus tracked expenses.</p>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/28 bg-white/28 backdrop-blur-3xl'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Latest activity</div>
                  <div className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                    {dashboardData?.recentTransactions?.length ? `${dashboardData.recentTransactions.length} recent items` : 'No recent items'}
                  </div>
                  <p className={`mt-1 text-xs md:text-sm ${mutedText}`}>Transactions, recurring events, and goal updates feed this view.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
