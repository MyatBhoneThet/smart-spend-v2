import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LuChevronDown,
  LuDownload,
  LuPencil,
  LuPlus,
  LuTrash2,
} from 'react-icons/lu';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from "../../components/layout/DashboardLayout";
import Modal from "../../components/layout/Modal";
import AddExpenseForm from "../../components/Expense/AddExpenseForm";
import DeleteAlert from "../../components/layout/DeleteAlert";
import BulkDeleteExpense from "../../components/Expense/bulkDeleteExpense";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-toastify";
import { useUserAuth } from "../../hooks/useUserAuth";
import { syncRecurring } from "../../utils/syncRecurring";
import FilterControl from "../../components/common/FilterControl";
import { UserContext } from "../../context/UserContext";
import { useCurrency } from "../../context/CurrencyContext";
import useT from "../../hooks/useT";
import NeonTopBar from "../../components/Dashboard/NeonTopBar";

const PERIOD_DAYS = { W: 7, M: 30, Q: 90, Y: 365 };

const monthYearLabel = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);

const shortDateLabel = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

const sourceTitle = (item) =>
  item.source?.trim() || item.categoryName || item.category || 'Expense';

const categoryLabel = (item) =>
  item.categoryName || item.category || 'Uncategorized';

const isImageUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//.test(value);

const renderExpenseIcon = (icon) => {
  if (!icon) return <span>💳</span>;
  if (isImageUrl(icon)) {
    return <img src={icon} alt="Expense icon" className="h-7 w-7 rounded-lg object-cover" />;
  }
  return <span>{icon}</span>;
};

const Expense = () => {
  useUserAuth();

  const { user, prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { format } = useCurrency();
  const { t } = useT();

  const [expenseData, setExpenseData] = useState([]);
  const [filteredExpense, setFilteredExpense] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Y');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [openEditExpenseModal, setOpenEditExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ show: false, data: null });
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  const mounted = useRef(true);
  const didAutoSelectLatest = useRef(false);

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const MONTHS = [
    tt('month.january', 'January'),
    tt('month.february', 'February'),
    tt('month.march', 'March'),
    tt('month.april', 'April'),
    tt('month.may', 'May'),
    tt('month.june', 'June'),
    tt('month.july', 'July'),
    tt('month.august', 'August'),
    tt('month.september', 'September'),
    tt('month.october', 'October'),
    tt('month.november', 'November'),
    tt('month.december', 'December'),
  ];

  const fetchExpenseDetails = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await syncRecurring({ silent: true });
      const { data } = await axiosInstance.get(API_PATHS.EXPENSE.GET_ALL_EXPENSE);
      if (!mounted.current) return;
      const list = Array.isArray(data) ? data : [];
      setExpenseData(list);
      setFilteredExpense(list);

      if (list.length && !didAutoSelectLatest.current) {
        const latest = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (latest?.date) {
          const latestDate = new Date(latest.date);
          setSelectedMonth(latestDate.getMonth());
          setSelectedYear(latestDate.getFullYear());
          didAutoSelectLatest.current = true;
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(tt("expense.text5", "Failed to load expenses."));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA(selectedPeriod));
      if (mounted.current) setDashboardData(data || null);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchExpenseDetails(), fetchDashboardData()]);
  };

  const handleAddExpense = async (expense) => {
    const { source, categoryId, categoryName, amount, date, icon } = expense;

    if (!source?.trim()) return toast.error(tt("expense.text1", "Source is required."));
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return toast.error(tt("expense.text2", "Amount must be greater than 0."));
    }
    if (!date) return toast.error(tt("expense.text3", "Date is required."));

    try {
      await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, {
        source: source.trim(),
        categoryId: categoryId || undefined,
        category: categoryName || undefined,
        amount: Number(amount),
        date,
        icon: icon || "",
      });

      await syncRecurring({ silent: false });
      setOpenAddExpenseModal(false);
      toast.success(tt("expense.text4", "Expense added successfully."));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(error?.response?.data?.message || tt("expense.text5", "Something went wrong."));
    }
  };

  const handleUpdateExpense = async (payload) => {
    if (!selectedExpense?._id) return;

    try {
      await axiosInstance.put(API_PATHS.EXPENSE.UPDATE_EXPENSE(selectedExpense._id), {
        source: (payload.source || "").trim(),
        categoryId: payload.categoryId || undefined,
        category: payload.categoryName || undefined,
        amount: Number(payload.amount),
        date: payload.date,
        icon: payload.icon || "",
      });

      setOpenEditExpenseModal(false);
      setSelectedExpense(null);
      toast.success(tt("expense.text6", "Expense updated successfully."));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(error?.response?.data?.message || tt("expense.text7", "Update failed."));
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(id));
      await syncRecurring({ silent: false });
      setOpenDeleteAlert({ show: false, data: null });
      toast.success(tt("expense.text8", "Expense deleted successfully."));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(error?.response?.data?.message || tt("expense.text5", "Something went wrong."));
    }
  };

  const handleBulkDelete = async (period) => {
    try {
      const { data } = await axiosInstance.delete(
        API_PATHS.EXPENSE.BULK_DELETE_EXPENSE(period)
      );
      setOpenBulkDeleteModal(false);
      toast.success(data?.message || tt("expense.text8", "Expense deleted successfully."));
      await refreshData();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || tt("expense.text5", "Something went wrong."));
    }
  };

  const handleDownloadExpenseDetails = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.EXPENSE.DOWNLOAD_EXCEL, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(tt("expense.text9", "Something went wrong while downloading."));
    }
  };

  useEffect(() => {
    mounted.current = true;
    refreshData();
    return () => {
      mounted.current = false;
    };
  }, []);

  const sortedExpense = useMemo(
    () => [...expenseData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenseData]
  );

  const periodExpense = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[selectedPeriod]);
    return sortedExpense.filter((item) => new Date(item.date).getTime() >= cutoff.getTime());
  }, [selectedPeriod, sortedExpense]);

  const currentMonthExpense = useMemo(() => {
    const now = new Date();
    return expenseData.reduce((sum, item) => {
      const date = new Date(item.date);
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  }, [expenseData]);

  const previousMonthExpense = useMemo(() => {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expenseData.reduce((sum, item) => {
      const date = new Date(item.date);
      if (date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear()) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  }, [expenseData]);

  const monthChange = useMemo(() => {
    if (!previousMonthExpense) return currentMonthExpense > 0 ? 100 : 0;
    return Math.round(((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100);
  }, [currentMonthExpense, previousMonthExpense]);

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return expenseData.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenseData]);

  const avgWeekly = useMemo(() => {
    const weeksElapsed = Math.max(1, Math.ceil(new Date().getDate() / 7));
    return currentMonthExpense / weeksElapsed;
  }, [currentMonthExpense]);

  const availableYears = useMemo(() => {
    const years = new Set(expenseData.map((item) => new Date(item.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [expenseData]);

  const overviewExpense = useMemo(() => {
    return sortedExpense
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedMonth, selectedYear, sortedExpense]);

  const overviewStats = useMemo(() => {
    const total = overviewExpense.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const highest = overviewExpense.reduce((max, item) => Math.max(max, Number(item.amount || 0)), 0);
    const average = overviewExpense.length ? total / overviewExpense.length : 0;
    return { total, transactions: overviewExpense.length, highest, average };
  }, [overviewExpense]);

  const overviewLineData = useMemo(() => {
    const grouped = overviewExpense.reduce((acc, item) => {
      const day = new Date(item.date).getDate();
      acc[day] = (acc[day] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const slotCount = Math.min(12, daysInMonth);
    const step = Math.max(1, Math.floor(daysInMonth / slotCount));
    const days = [];

    for (let day = 1; day <= daysInMonth && days.length < slotCount; day += step) {
      days.push(day);
    }
    if (days[days.length - 1] !== daysInMonth) {
      days[days.length - 1] = daysInMonth;
    }

    const entries = days.map((day) => {
      const nextDay = days.find((value) => value > day) ?? (daysInMonth + 1);
      let amount = 0;
      for (let currentDay = day; currentDay < nextDay; currentDay += 1) {
        amount += Number(grouped[currentDay] || 0);
      }
      return { day, amount, label: shortDateLabel(new Date(selectedYear, selectedMonth, day)) };
    });

    const maxAmount = Math.max(...entries.map((item) => item.amount), 1);
    return entries.map((item) => ({
      ...item,
      amount: Number(item.amount || 0),
      maxAmount,
    }));
  }, [overviewExpense, selectedMonth, selectedYear]);

  const monthlyPace = useMemo(() => {
    const buckets = {};
    expenseData.forEach((item) => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!buckets[key]) {
        buckets[key] = {
          label: monthYearLabel(new Date(date.getFullYear(), date.getMonth(), 1)),
          amount: 0,
        };
      }
      buckets[key].amount += Number(item.amount || 0);
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-4)
      .map(([, value]) => value);
  }, [expenseData]);

  const maxPace = useMemo(() => Math.max(...monthlyPace.map((item) => item.amount), 1), [monthlyPace]);
  const visibleSources = useMemo(() => filteredExpense.slice(0, 6), [filteredExpense]);

  const statCards = [
    {
      title: tt('dashboard.totalExpenses', 'TOTAL EXPENSE'),
      value: format(periodExpense.reduce((sum, item) => sum + Number(item.amount || 0), 0)),
      subtitle: `${tt(`dashboard.period.${selectedPeriod}`, selectedPeriod)} · ${new Set(periodExpense.map((item) => sourceTitle(item))).size} ${tt('expense.sourcesCount', 'sources')}`,
      badge: `${monthChange >= 0 ? '↑' : '↓'} ${Math.abs(monthChange)}% vs last month`,
      accent: isDark ? 'text-[#ff6b81]' : 'text-[#ef4444]',
      badgeAccent: isDark ? 'text-[#ff6b81] bg-[#ff6b81]/10' : 'text-[#ef4444] bg-[#ef4444]/10',
      glow: isDark ? 'from-[#ff6b81]/20 to-transparent' : 'from-[#ef4444]/20 to-transparent',
    },
    {
      title: tt('dashboard.thisMonth', 'THIS MONTH'),
      value: format(currentMonthExpense),
      subtitle: tt('expense.spentSoFar', 'Spent so far'),
      badge: `${currentMonthTransactions.length} ${tt('dashboard.transactions', 'transactions')}`,
      accent: isDark ? 'text-white' : 'text-[#11131b]',
      badgeAccent: 'text-[#8b5cf6] bg-[#8b5cf6]/10',
      glow: 'from-white/10 to-transparent',
    },
    {
      title: tt('dashboard.avgWeekly', 'AVG WEEKLY'),
      value: format(avgWeekly),
      subtitle: tt('dashboard.basedOnCurrentMonth', 'Based on current month'),
      badge: avgWeekly > 0 ? tt('expense.runningSpend', 'Running spend') : tt('dashboard.noActivity', 'No activity'),
      accent: 'text-[#47d7ff]',
      badgeAccent: 'text-[#47d7ff] bg-[#47d7ff]/10',
      glow: 'from-[#47d7ff]/20 to-transparent',
    },
  ];
  const pageClass = isDark
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(255,182,193,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(71,215,255,0.08),transparent_22%),linear-gradient(180deg,#090b11_0%,#05070b_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(255,182,193,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_20%),linear-gradient(180deg,#fefbf8_0%,#f9eef1_100%)] text-[#11131b]';
  const cardClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.38)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#11131b] shadow-[0_24px_90px_rgba(15,23,42,0.08)] ring-1 ring-white/45 backdrop-blur-3xl';
  const sectionDivider = isDark ? 'border-white/10' : 'border-white/45';
  const labelText = isDark ? 'text-[#8a90a7]' : 'text-[#6b7080]';
  const mutedText = isDark ? 'text-[#7b8095]' : 'text-[#6b6f80]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white placeholder:text-[#848aa0] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
    : 'border-white/28 bg-white/28 text-[#11131b] placeholder:text-[#8a8f9f] shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-3xl';
  const outlineButton = isDark
    ? 'border-white/10 bg-white/[0.05] text-[#d0d3e4] hover:bg-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#31374a] hover:bg-white/42 backdrop-blur-3xl';
  const subtleSurface = isDark
    ? 'border-white/10 bg-white/[0.05]'
    : 'border-white/28 bg-white/22 backdrop-blur-3xl';

  return (
    <DashboardLayout activeMenu="Expense">
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${pageClass}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -left-20 top-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-[#ffb6c1]/10' : 'bg-[#ffb6c1]/18'}`} />
          <div className={`absolute right-6 top-40 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-[#fb7185]/10' : 'bg-[#fb7185]/14'}`} />
          <div className={`absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full blur-3xl ${isDark ? 'bg-[#47d7ff]/8' : 'bg-white/50'}`} />
        </div>
        <div className="relative mx-auto max-w-[1320px] p-4 pt-4 md:p-5 md:pt-6">
          <NeonTopBar
            title={tt('menu.expense', 'EXPENSE')}
            subtitle={tt('expense.trackSpending', 'Track your spending')}
            userName={user?.fullName?.split(' ')[0] || user?.username}
            liveLabel=""
            periodLabel=""
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            actionLabel={tt('expense.addExpense', 'Add Expense')}
            onAddTransaction={() => setOpenAddExpenseModal(true)}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.title} className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
                <div className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial ${card.glow} blur-3xl opacity-80`} />
                <div className={`pointer-events-none absolute inset-0 ${isDark ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent)]' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.56),transparent_36%,transparent)]'}`} />
                <div className="relative">
                  <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{card.title}</div>
                  <div className={`text-4xl font-black tracking-tight ${card.accent}`}>{card.value}</div>
                  <div className={`mt-3 text-sm ${mutedText}`}>{card.subtitle}</div>
                  <div className={`mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-bold ${card.badgeAccent}`}>{card.badge}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-5 rounded-[24px] border p-6 ${cardClass}`}>
            <div className={`flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
              <div>
                <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('expense.overview', 'Expense Overview')}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className={`appearance-none rounded-2xl border px-4 py-2 pr-10 text-sm font-semibold outline-none ${inputClass}`}
                    aria-label="Select month"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>
                  <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7f8399]" />
                </label>
                <label className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={`appearance-none rounded-2xl border px-4 py-2 pr-10 text-sm font-semibold outline-none ${inputClass}`}
                    aria-label="Select year"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7f8399]" />
                </label>
                  <button
                    type="button"
                    onClick={() => setOpenAddExpenseModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-[#ff6b81]/90 px-5 py-2.5 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,107,129,0.28)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:bg-[#ff5f7a]"
                  >
                    <LuPlus />
                    {tt('expense.add', 'Add Expense')}
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 border-b py-5 md:grid-cols-4 ${sectionDivider}`}>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>{tt('expense.totalPeriod', 'Total Period')}</div>
                <div className="mt-2 text-2xl font-black text-[#ff6b81]">{format(overviewStats.total)}</div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>{tt('expense.transactionsCount', 'Transactions')}</div>
                <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{overviewStats.transactions}</div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>{tt('expense.highestSingle', 'Highest Single')}</div>
                <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(overviewStats.highest)}</div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>{tt('expense.average', 'Average')}</div>
                <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(overviewStats.average)}</div>
              </div>
            </div>

            <div className="pt-8">
              {overviewLineData.length ? (
                <div className="h-[280px]">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={overviewLineData}
                        margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="expenseOverviewArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff6b81" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#ff6b81" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,19,27,0.10)'}
                          strokeDasharray="3 3"
                        />
                        <XAxis dataKey="label" hide />
                        <YAxis
                          hide
                          domain={[0, (dataMax) => Math.max(dataMax || 0, 1)]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0]?.payload;
                            return (
                            <div className={`rounded-xl border px-3 py-2 shadow-xl backdrop-blur-2xl ${isDark ? 'border-white/10 bg-white/[0.08]' : 'border-white/70 bg-white/88'}`}>
                              <div className={`text-xs font-bold uppercase tracking-[0.18em] ${labelText}`}>
                                {point?.label}
                              </div>
                                <div className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                                  {format(point?.amount || 0)}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#ff6b81"
                          strokeWidth={3}
                          fill="url(#expenseOverviewArea)"
                          dot={{ r: 3, fill: '#ff6b81', stroke: isDark ? '#11131b' : '#fffdf7', strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: '#ff6b81', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`mt-4 grid grid-cols-6 gap-y-3 text-center text-xs font-medium tracking-[0.18em] ${mutedText} md:grid-cols-12`}>
                    {overviewLineData.map((point) => (
                      <div key={point.label}>{point.label}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`py-16 text-center text-sm ${mutedText}`}>
                  {tt('expense.noDataForMonth', 'No expense data for')} {MONTHS[selectedMonth]} {selectedYear}.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <section className={`rounded-[24px] border p-6 ${cardClass}`}>
              <div className={`flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
                <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('expense.sources', 'Expense Sources')}</h2>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadExpenseDetails}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LuDownload />
                      {tt('expense.export', 'Export')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenBulkDeleteModal(true)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LuTrash2 />
                      {tt('expense.bulkDelete', 'Bulk Delete')}
                    </span>
                  </button>

                  <FilterControl
                    items={periodExpense}
                    fieldMap={{
                      date: "date",
                      category: "category",
                      amount: "amount",
                      text: "source",
                    }}
                    onChange={setFilteredExpense}
                    label={tt("expense.filter", "Filter")}
                    theme="neon"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-5">
                {visibleSources.length ? (
                  visibleSources.map((item) => (
                    <div
                      key={item._id}
                      className={`flex flex-col gap-3 rounded-2xl border px-3 py-3 transition-all md:flex-row md:items-center md:justify-between ${
                        isDark
                          ? 'border-white/0 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                          : 'border-white/0 bg-white/45 hover:border-white/45 hover:bg-white/65'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-lg ${isDark ? 'bg-[#2a1117] text-[#ffb6c1]' : 'bg-[#ffe4ea] text-[#fb7185]'}`}>
                          {renderExpenseIcon(item.icon)}
                        </div>
                        <div>
                          <div className={`text-[18px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{sourceTitle(item)}</div>
                          <div className={`mt-1 text-sm uppercase tracking-[0.18em] ${mutedText}`}>
                            {categoryLabel(item)} · {shortDateLabel(item.date)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:min-w-[280px] md:justify-end">
                        <span className={`rounded-xl px-4 py-2 text-sm font-bold backdrop-blur-2xl ${isDark ? 'bg-[#ff6b81]/12 text-[#ff9bad]' : 'bg-[#ff6b81]/12 text-[#ef4444]'}`}>
                          Expense
                        </span>
                        <span className={`min-w-[120px] text-right text-[18px] font-black ${isDark ? 'text-[#ff6b81]' : 'text-[#ef4444]'}`}>
                          -{format(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExpense(item);
                            setOpenEditExpenseModal(true);
                          }}
                          className={`rounded-xl border p-2 transition-all backdrop-blur-3xl ${isDark ? 'border-white/10 bg-white/[0.05] text-[#aab0c5] hover:bg-white/[0.1]' : 'border-white/45 bg-white/58 text-[#4e5569] hover:bg-white/88'}`}
                          aria-label="Edit expense"
                        >
                          <LuPencil />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenDeleteAlert({ show: true, data: item._id })}
                          className={`rounded-xl border p-2 transition-all backdrop-blur-3xl ${isDark ? 'border-white/10 bg-white/[0.05] text-[#aab0c5] hover:bg-white/[0.1]' : 'border-white/45 bg-white/58 text-[#4e5569] hover:bg-white/88'}`}
                          aria-label="Delete expense"
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`py-10 text-sm ${mutedText}`}>
                    {tt('expense.noDataFilter', 'No expense data available for the current filters.')}
                  </div>
                )}
              </div>
            </section>

            <aside className={`rounded-[24px] border p-6 ${cardClass}`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className={`text-[13px] font-black uppercase tracking-[0.14em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {tt('dashboard.monthlyPace', 'Monthly Pace')}
                </h3>
                <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${mutedText}`}>
                  {tt('dashboard.last4Months', 'Last 4 Months')}
                </span>
              </div>

              <div className="space-y-5">
                {monthlyPace.length ? (
                  monthlyPace.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{item.label}</p>
                        <p className="text-sm font-bold text-[#ff6b81]">{format(item.amount)}</p>
                      </div>
                      <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-white/58'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#ffb6c1] via-[#ff6b81] to-[#ef4444]"
                          style={{ width: `${Math.max(12, Math.round((item.amount / maxPace) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${mutedText}`}>
                    {tt('expense.pacingFallback', 'Monthly pacing appears here once expenses start coming in.')}
                  </p>
                )}
              </div>

              <div className={`mt-8 rounded-2xl border p-5 ${subtleSurface}`}>
                <div className={`text-[11px] uppercase tracking-[0.22em] ${mutedText}`}>{tt('expense.allTimeTotal', 'All-time total')}</div>
                <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(dashboardData?.totalExpenses || 0)}</div>
                <div className={`mt-3 text-sm ${mutedText}`}>
                  {tt('expense.netBalance', 'Net balance:')} {format(dashboardData?.totalBalance || 0)}
                </div>
              </div>
            </aside>
          </div>

          <Modal
            isOpen={openAddExpenseModal}
            onClose={() => setOpenAddExpenseModal(false)}
            title={tt('expense.add', 'Add Expense')}
            accent="expense"
          >
            <AddExpenseForm onAddExpense={handleAddExpense} mode="add" variant="neon" />
          </Modal>

          <Modal
            isOpen={openEditExpenseModal}
            onClose={() => setOpenEditExpenseModal(false)}
            title={tt('expense.edit', 'Edit Expense')}
            accent="expense"
          >
            <AddExpenseForm
              mode="edit"
              initial={selectedExpense}
              onUpdateExpense={handleUpdateExpense}
              variant="neon"
            />
          </Modal>

          <Modal
            isOpen={openDeleteAlert.show}
            onClose={() => setOpenDeleteAlert({ show: false, data: null })}
            title={tt('expense.delete', 'Delete Expense')}
            accent="neutral"
          >
            <DeleteAlert
              content={tt('expense.deleteAlert', 'Are you sure you want to delete this expense?')}
              onDelete={() => deleteExpense(openDeleteAlert.data)}
            />
          </Modal>

          <Modal
            isOpen={openBulkDeleteModal}
            onClose={() => setOpenBulkDeleteModal(false)}
            title={tt('expense.bulkDelete', 'Bulk Delete Expenses')}
            accent="neutral"
          >
            <BulkDeleteExpense
              isOpen={openBulkDeleteModal}
              onClose={() => setOpenBulkDeleteModal(false)}
              onConfirm={handleBulkDelete}
              isDarkTheme
              variant="neon"
            />
          </Modal>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
