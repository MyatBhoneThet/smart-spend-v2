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
import DashboardLayout from '../../components/layouts/DashboardLayout';
import NeonTopBar from '../../components/NeonDashboard/NeonTopBar';
import DarkCashFlowChart from '../../components/NeonDashboard/DarkCashFlowChart';
import DarkRecentTransactions from '../../components/NeonDashboard/DarkRecentTransactions';
import DarkSpendingChart from '../../components/NeonDashboard/DarkSpendingChart';
import DarkGoalsWidget from '../../components/NeonDashboard/DarkGoalsWidget';
import DarkRecurringWidget from '../../components/NeonDashboard/DarkRecurringWidget';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useUserAuth } from '../../hooks/useUserAuth';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const { user, prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { format } = useCurrency();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (loading) return;
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
        if (active) setDashboardData(data || null);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const pct = (value, total) => {
    if (!total) return 0;
    return Math.round((Number(value || 0) / Number(total || 0)) * 100);
  };

  const statCards = [
    {
      title: 'NET BALANCE',
      amount: format(dashboardData?.totalBalance || 0),
      subtitle: 'Across all tracked accounts',
      badgeText: `${pct(dashboardData?.totalExpenses, dashboardData?.totalIncome)}% expense ratio`,
      accent: 'text-[#8b5cf6]',
      badgeClass: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
      glow: 'from-[#8b5cf6]/20 to-transparent',
      icon: LuWalletCards,
    },
    {
      title: 'TOTAL INCOME',
      amount: format(dashboardData?.totalIncome || 0),
      subtitle: 'All-time total',
      badgeText: `${format(dashboardData?.last60DaysIncome?.total || 0)} in last 60 days`,
      accent: 'text-[#d9ff34]',
      badgeClass: 'bg-[#d9ff34]/10 text-[#d9ff34]',
      glow: 'from-[#d9ff34]/20 to-transparent',
      icon: LuArrowUpRight,
    },
    {
      title: 'TOTAL EXPENSES',
      amount: format(dashboardData?.totalExpenses || 0),
      subtitle: 'All-time total',
      badgeText: `${format(dashboardData?.last30DaysExpenses?.total || 0)} in last 30 days`,
      accent: 'text-[#fb7185]',
      badgeClass: 'bg-[#fb7185]/10 text-[#fb7185]',
      glow: 'from-[#fb7185]/20 to-transparent',
      icon: LuArrowDownRight,
    },
  ];

  const cashFlowData = useMemo(() => {
    const incomeTransactions = dashboardData?.last60DaysIncome?.transactions || [];
    const expenseTransactions = dashboardData?.last30DaysExpenses?.transactions || [];
    const buckets = {};

    const addToBucket = (txn, type) => {
      const d = new Date(txn.date);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString();
      if (!buckets[key]) buckets[key] = { date: monday, income: 0, expense: 0 };
      buckets[key][type] += Number(txn.amount || 0);
    };

    incomeTransactions.forEach((t) => addToBucket(t, 'income'));
    expenseTransactions.forEach((t) => addToBucket(t, 'expense'));

    return Object.values(buckets)
      .sort((a, b) => a.date - b.date)
      .map((bucket) => ({
        date: bucket.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: Math.round(bucket.income),
        expense: Math.round(bucket.expense),
      }));
  }, [dashboardData]);

  const quickActions = [
    {
      title: 'Add income',
      subtitle: 'Capture a new earning source',
      icon: LuArrowUpRight,
      color: 'text-[#d9ff34]',
      bg: isDark ? 'bg-[#202814]' : 'bg-[#eef6cb]',
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
  const panelClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const topCardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_12px_32px_rgba(0,0,0,0.4)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.98)] text-[#11131b] shadow-[0_18px_45px_rgba(15,23,42,0.08)]';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-4 pt-6 md:p-8 md:pt-10">
          <NeonTopBar
            title="DASHBOARD"
            subtitle={`Overview for ${user?.fullName?.split(' ')[0] || user?.username || 'User'}`}
            userName={user?.fullName?.split(' ')[0] || user?.username}
            onAddTransaction={() => navigate('/expense')}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className={`relative overflow-hidden rounded-[28px] border p-7 ${topCardClass}`}
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-radial ${card.glow} blur-3xl opacity-70`} />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`text-[11px] font-bold uppercase tracking-[0.24em] ${labelText}`}>{card.title}</div>
                        <div className={`mt-4 text-[40px] font-black leading-none tracking-[-0.04em] ${card.accent}`}>
                          {card.amount}
                        </div>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-white/[0.04]' : 'bg-[rgba(17,19,27,0.04)]'}`}>
                        <Icon className={`text-xl ${card.accent}`} />
                      </div>
                    </div>

                    <div className={`mt-4 text-sm ${mutedText}`}>{card.subtitle}</div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${card.badgeClass}`}>
                        {card.badgeText}
                      </span>
                      <span className={`text-xs font-semibold ${mutedText}`}>Updated now</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="grid grid-cols-1 gap-6">
              <DarkCashFlowChart data={cashFlowData} valueFormatter={(value) => format(value)} />

              <div className={`rounded-[28px] border p-8 ${panelClass}`}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Quick Actions</h2>
                    <p className={`mt-2 text-sm ${mutedText}`}>Common workflows, one tap away.</p>
                  </div>
                  <LuWalletCards className={`text-xl ${labelText}`} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={item.action}
                        className={`flex items-start gap-4 rounded-[22px] border p-5 text-left transition-all ${
                          isDark
                            ? 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                            : 'border-black/8 bg-[rgba(17,19,27,0.02)] hover:bg-[rgba(17,19,27,0.05)]'
                        }`}
                      >
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}>
                          <Icon className={`text-xl ${item.color}`} />
                        </div>
                        <div>
                          <div className={`text-base font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{item.title}</div>
                          <div className={`mt-1 text-sm ${mutedText}`}>{item.subtitle}</div>
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <DarkSpendingChart data={spendingData} format={format} />

            <div className={`rounded-[28px] border p-6 ${panelClass}`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className={`text-[13px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Focus Metrics</h3>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.05]' : 'border-black/10 text-[#31374a] hover:bg-black/[0.04]'}`}
                >
                  Refresh View
                </button>
              </div>

              <div className="space-y-5">
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${labelText}`}>This month income</div>
                  <div className="mt-2 text-3xl font-black text-[#d9ff34]">{format(dashboardData?.last60DaysIncome?.total || 0)}</div>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${labelText}`}>Recurring monthly</div>
                  <div className="mt-2 text-3xl font-black text-[#fb7185]">{format(dashboardData?.recurring?.monthlyTotal || 0)}</div>
                </div>
                <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] ${labelText}`}>Active goals</div>
                  <div className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                    {dashboardData?.goals?.active ?? dashboardData?.goals?.total ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <DarkRecurringWidget recurring={mappedRecurring} totalAmount={dashboardData?.recurring?.monthlyTotal || 0} format={format} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DarkGoalsWidget goals={mappedGoals} totalGoals={dashboardData?.goals?.active ?? dashboardData?.goals?.total ?? 0} />

            <div className={`rounded-[28px] border p-8 ${panelClass}`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className={`text-[13px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>System Status</h3>
                <LuChartNoAxesCombined className={`text-lg ${labelText}`} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Budget signal</div>
                  <div className="mt-3 text-xl font-black text-[#47d7ff]">
                    {dashboardData?.totalBalance >= 0 ? 'Healthy' : 'Watchlist'}
                  </div>
                  <p className={`mt-2 text-sm ${mutedText}`}>Based on current total balance versus tracked expenses.</p>
                </div>
                <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${labelText}`}>Latest activity</div>
                  <div className={`mt-3 text-xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                    {dashboardData?.recentTransactions?.length ? `${dashboardData.recentTransactions.length} recent items` : 'No recent items'}
                  </div>
                  <p className={`mt-2 text-sm ${mutedText}`}>Transactions, recurring events, and goal updates feed this view.</p>
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
