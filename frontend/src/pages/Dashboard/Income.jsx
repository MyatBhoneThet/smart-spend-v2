import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  LuChevronDown,
  LuDownload,
  LuPencil,
  LuPlus,
  LuTrash2,
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/layouts/Modal';
import AddIncomeForm from '../../components/Income/AddIncomeForm';
import DeleteAlert from '../../components/layouts/DeleteAlert';
import BulkDeleteIncome from '../../components/Income/bulkDeleteIncome';
import FilterControl from '../../components/common/FilterControl';
import NeonTopBar from '../../components/NeonDashboard/NeonTopBar';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useUserAuth } from '../../hooks/useUserAuth';
import { syncRecurring } from '../../utils/syncRecurring';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';

const PERIOD_DAYS = {
  W: 7,
  M: 30,
  Q: 90,
  Y: 365,
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthYearLabel = (date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);

const shortDateLabel = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

const sourceTitle = (item) =>
  item.source?.trim() || item.categoryName || item.category || 'Income';

const categoryLabel = (item) =>
  item.categoryName || item.category || 'Uncategorized';

const isImageUrl = (value) =>
  typeof value === 'string' && /^https?:\/\//.test(value);

const renderIncomeIcon = (icon) => {
  if (!icon) return <span>💼</span>;
  if (isImageUrl(icon)) {
    return (
      <img
        src={icon}
        alt="Income icon"
        className="h-7 w-7 rounded-lg object-cover"
      />
    );
  }
  return <span>{icon}</span>;
};

const Income = () => {
  useUserAuth();

  const { user, prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { format } = useCurrency();
  const { t } = useT();

  const [incomeData, setIncomeData] = useState([]);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('M');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
  const [openEditIncomeModal, setOpenEditIncomeModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    show: false,
    data: null,
  });
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  const mounted = useRef(true);

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const fetchIncomeDetails = async () => {
    if (loading) return;
    setLoading(true);

    try {
      syncRecurring({ silent: true });
      const { data } = await axiosInstance.get(API_PATHS.INCOME.GET_ALL_INCOME);

      if (!mounted.current) return;

      const list = Array.isArray(data) ? data : [];
      setIncomeData(list);
      setFilteredIncome(list);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
      if (mounted.current) setDashboardData(data || null);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchIncomeDetails(), fetchDashboardData()]);
  };

  const handleAddIncome = async (income) => {
    const { source, categoryId, categoryName, amount, date, icon } = income;

    if (!source?.trim()) {
      return toast.error(tt('income.text1', 'Source is required.'));
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return toast.error(tt('income.text2', 'Amount must be greater than 0.'));
    }
    if (!date) {
      return toast.error(tt('income.text3', 'Date is required.'));
    }

    try {
      await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, {
        source: source.trim(),
        categoryId: categoryId || undefined,
        category: categoryName || undefined,
        amount: Number(amount),
        date,
        icon: icon || '',
      });

      syncRecurring({ silent: false });
      setOpenAddIncomeModal(false);
      toast.success(tt('income.text4', 'Income added successfully.'));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || tt('income.text5', 'Something went wrong.')
      );
    }
  };

  const handleUpdateIncome = async (payload) => {
    if (!selectedIncome?._id) return;

    try {
      await axiosInstance.put(API_PATHS.INCOME.UPDATE_INCOME(selectedIncome._id), {
        source: (payload.source || '').trim(),
        categoryId: payload.categoryId || undefined,
        category: payload.categoryName || undefined,
        amount: Number(payload.amount),
        date: payload.date,
        icon: payload.icon || '',
      });

      setOpenEditIncomeModal(false);
      setSelectedIncome(null);
      toast.success(tt('income.text6', 'Income updated successfully.'));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || tt('income.text7', 'Update failed.')
      );
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME(id));
      syncRecurring({ silent: false });
      setOpenDeleteAlert({ show: false, data: null });
      toast.success(tt('income.text8', 'Income deleted successfully.'));
      await refreshData();
    } catch (error) {
      console.error(error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || tt('income.text5', 'Something went wrong.')
      );
    }
  };

  const handleBulkDelete = async (period) => {
    try {
      const { data } = await axiosInstance.delete(
        API_PATHS.INCOME.BULK_DELETE_INCOME(period)
      );
      setOpenBulkDeleteModal(false);
      toast.success(data?.message || tt('income.text8', 'Income deleted successfully.'));
      await refreshData();
    } catch (error) {
      toast.error(error?.message || tt('income.text5', 'Something went wrong.'));
    }
  };

  const handleDownloadIncomeDetails = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.INCOME.DOWNLOAD_EXCEL, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'income_details.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(tt('income.text9', 'Something went wrong while downloading.'));
    }
  };

  useEffect(() => {
    mounted.current = true;
    refreshData();

    return () => {
      mounted.current = false;
    };
  }, []);

  const sortedIncome = useMemo(
    () =>
      [...incomeData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [incomeData]
  );

  const periodIncome = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[selectedPeriod]);

    return sortedIncome.filter(
      (item) => new Date(item.date).getTime() >= cutoff.getTime()
    );
  }, [selectedPeriod, sortedIncome]);

  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    return incomeData.reduce((sum, item) => {
      const date = new Date(item.date);
      if (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  }, [incomeData]);

  const previousMonthIncome = useMemo(() => {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return incomeData.reduce((sum, item) => {
      const date = new Date(item.date);
      if (
        date.getMonth() === previous.getMonth() &&
        date.getFullYear() === previous.getFullYear()
      ) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  }, [incomeData]);

  const monthChange = useMemo(() => {
    if (!previousMonthIncome) return currentMonthIncome > 0 ? 100 : 0;
    return Math.round(
      ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
    );
  }, [currentMonthIncome, previousMonthIncome]);

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return incomeData.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [incomeData]);

  const avgWeekly = useMemo(() => {
    const weeksElapsed = Math.max(1, Math.ceil(new Date().getDate() / 7));
    return currentMonthIncome / weeksElapsed;
  }, [currentMonthIncome]);

  const availableYears = useMemo(() => {
    const years = new Set(incomeData.map((item) => new Date(item.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [incomeData]);

  const overviewIncome = useMemo(() => {
    return sortedIncome
      .filter((item) => {
        const date = new Date(item.date);
        return (
          date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedMonth, selectedYear, sortedIncome]);

  const overviewStats = useMemo(() => {
    const total = overviewIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const highest = overviewIncome.reduce(
      (max, item) => Math.max(max, Number(item.amount || 0)),
      0
    );
    const average = overviewIncome.length ? total / overviewIncome.length : 0;
    return {
      total,
      transactions: overviewIncome.length,
      highest,
      average,
    };
  }, [overviewIncome]);

  const overviewChartBars = useMemo(() => {
    const grouped = overviewIncome.reduce((acc, item) => {
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

      return {
        id: `${selectedYear}-${selectedMonth}-${day}`,
        day,
        amount,
      };
    });

    const maxAmount = Math.max(...entries.map((item) => item.amount), 1);

    return entries.map((item, index, arr) => ({
      ...item,
      label: shortDateLabel(new Date(selectedYear, selectedMonth, item.day)),
      height:
        item.amount > 0
          ? `${Math.max(26, Math.round((item.amount / maxAmount) * 100))}%`
          : '8%',
      emphasis: item.amount > 0 && (index === arr.length - 1 || item.amount === maxAmount),
    }));
  }, [overviewIncome, selectedMonth, selectedYear]);

  const monthlyPace = useMemo(() => {
    const buckets = {};

    incomeData.forEach((item) => {
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
  }, [incomeData]);

  const maxPace = useMemo(
    () => Math.max(...monthlyPace.map((item) => item.amount), 1),
    [monthlyPace]
  );

  const visibleSources = useMemo(() => filteredIncome.slice(0, 6), [filteredIncome]);

  const statCards = [
    {
      title: 'TOTAL INCOME',
      value: format(
        periodIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      ),
      subtitle: `This ${selectedPeriod === 'W' ? 'week' : selectedPeriod === 'M' ? 'month' : selectedPeriod === 'Q' ? 'quarter' : 'year'} · ${
        new Set(periodIncome.map((item) => sourceTitle(item))).size
      } sources`,
      badge: `${monthChange >= 0 ? '↑' : '↓'} ${Math.abs(monthChange)}% vs last month`,
      accent: 'text-[#d9ff34]',
      badgeAccent: 'text-[#d9ff34] bg-[#d9ff34]/10',
      glow: 'from-[#d9ff34]/20 to-transparent',
    },
    {
      title: 'THIS MONTH',
      value: format(currentMonthIncome),
      subtitle: 'Collected so far',
      badge: `${currentMonthTransactions.length} transactions`,
      accent: isDark ? 'text-white' : 'text-[#11131b]',
      badgeAccent: 'text-[#8b5cf6] bg-[#8b5cf6]/10',
      glow: 'from-white/10 to-transparent',
    },
    {
      title: 'AVG WEEKLY',
      value: format(avgWeekly),
      subtitle: 'Based on current month',
      badge: avgWeekly > 0 ? 'On track' : 'No activity',
      accent: 'text-[#47d7ff]',
      badgeAccent: 'text-[#47d7ff] bg-[#47d7ff]/10',
      glow: 'from-[#47d7ff]/20 to-transparent',
    },
  ];
  const cardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const sectionDivider = isDark ? 'border-white/8' : 'border-black/8';
  const labelText = isDark ? 'text-[#66697d]' : 'text-[#6b7080]';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-white'
    : 'border-black/10 bg-white text-[#11131b]';
  const outlineButton = isDark
    ? 'border-white/10 bg-white/[0.03] text-[#d0d3e4] hover:bg-white/[0.05]'
    : 'border-black/10 bg-white text-[#31374a] hover:bg-black/[0.04]';
  const subtleSurface = isDark
    ? 'border-white/8 bg-white/[0.03]'
    : 'border-black/8 bg-[rgba(17,19,27,0.03)]';

  return (
    <DashboardLayout activeMenu="Income">
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto max-w-[1600px] p-4 pt-6 md:p-8 md:pt-10">
          <NeonTopBar
            title="INCOME"
            subtitle="Track your earnings"
            userName={user?.fullName?.split(' ')[0] || user?.username}
            liveLabel=""
            periodLabel=""
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            actionLabel={tt('income.add', 'Add Income')}
            onAddTransaction={() => setOpenAddIncomeModal(true)}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {statCards.map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}
              >
                <div className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial ${card.glow} blur-3xl opacity-60`} />
                <div className="relative">
                  <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>
                    {card.title}
                  </div>
                  <div className={`text-5xl font-black tracking-tight ${card.accent}`}>
                    {card.value}
                  </div>
                  <div className={`mt-3 text-sm ${mutedText}`}>{card.subtitle}</div>
                  <div className={`mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-bold ${card.badgeAccent}`}>
                    {card.badge}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-6 rounded-[28px] border p-8 ${cardClass}`}>
            <div className={`flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
              <div>
                <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Income Overview</h2>
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
                      <option key={month} value={index}>
                        {month}
                      </option>
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
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7f8399]" />
                </label>
                <button
                  type="button"
                  onClick={() => setOpenAddIncomeModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#d9ff34] px-5 py-2.5 text-sm font-black text-black shadow-[0_0_16px_rgba(217,255,52,0.25)]"
                >
                  <LuPlus />
                  Add Income
                </button>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-6 border-b py-6 md:grid-cols-4 ${sectionDivider}`}>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>
                  Total Period
                </div>
                <div className="mt-2 text-3xl font-black text-[#d9ff34]">
                  {format(overviewStats.total)}
                </div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>
                  Transactions
                </div>
                <div className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {overviewStats.transactions}
                </div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>
                  Highest Single
                </div>
                <div className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {format(overviewStats.highest)}
                </div>
              </div>
              <div>
                <div className={`text-[11px] uppercase tracking-[0.28em] ${labelText}`}>
                  Average
                </div>
                <div className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {format(overviewStats.average)}
                </div>
              </div>
            </div>

            <div className="pt-8">
              {overviewChartBars.length ? (
                <div className="h-[260px]">
                  <div className="relative flex h-[210px] items-end gap-4 overflow-x-auto pb-2">
                    {overviewChartBars.map((bar) => (
                      <div
                        key={bar.id}
                        className="flex min-w-[84px] flex-col items-center justify-end gap-3"
                      >
                        <div className="relative flex h-[180px] w-full items-end justify-center">
                          <div className="absolute inset-x-0 bottom-0 top-0 rounded-2xl border border-transparent" />
                          <div
                            className={`w-14 rounded-[10px] ${
                              bar.emphasis
                                ? 'bg-[#d9ff34] shadow-[0_0_18px_rgba(217,255,52,0.28)]'
                                : bar.amount > 0
                                ? 'bg-[#aacb2d]'
                                : isDark ? 'bg-white/8' : 'bg-black/10'
                            }`}
                            style={{ height: bar.height }}
                            title={`${bar.label}: ${format(bar.amount)}`}
                          />
                        </div>
                        <div className={`text-xs font-medium tracking-[0.18em] ${mutedText}`}>
                          {bar.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={`py-16 text-center text-sm ${mutedText}`}>
                  No income data for {MONTHS[selectedMonth]} {selectedYear}.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <section className={`rounded-[28px] border p-8 ${cardClass}`}>
              <div className={`flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
                <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Income Sources</h2>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadIncomeDetails}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LuDownload />
                      Export
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpenBulkDeleteModal(true)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LuTrash2 />
                      Bulk Delete
                    </span>
                  </button>

                  <FilterControl
                    items={incomeData}
                    fieldMap={{
                      date: 'date',
                      category: 'category',
                      amount: 'amount',
                      text: 'source',
                    }}
                    onChange={setFilteredIncome}
                    label={tt('income.filter', 'Filter')}
                    theme="neon"
                  />
                </div>
              </div>

              <div className="space-y-5 pt-6">
                {visibleSources.length ? (
                  visibleSources.map((item) => (
                    <div
                      key={item._id}
                      className={`flex flex-col gap-4 rounded-2xl border border-transparent px-3 py-3 transition-colors md:flex-row md:items-center md:justify-between ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.03]'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${isDark ? 'bg-[#2b3517]' : 'bg-[#eef6cb]'}`}>
                          {renderIncomeIcon(item.icon)}
                        </div>
                        <div>
                          <div className={`text-[18px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                            {sourceTitle(item)}
                          </div>
                          <div className={`mt-1 text-sm uppercase tracking-[0.18em] ${mutedText}`}>
                            {categoryLabel(item)} · {shortDateLabel(item.date)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:min-w-[280px] md:justify-end">
                        <span className="rounded-xl bg-[#d9ff34]/10 px-4 py-2 text-sm font-bold text-[#d9ff34]">
                          Income
                        </span>
                        <span className="min-w-[120px] text-right text-[18px] font-black text-[#d9ff34]">
                          +{format(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIncome(item);
                            setOpenEditIncomeModal(true);
                          }}
                          className={`rounded-xl border p-2 ${isDark ? 'border-white/10 text-[#aab0c5] hover:bg-white/[0.05]' : 'border-black/10 text-[#4e5569] hover:bg-black/[0.04]'}`}
                          aria-label="Edit income"
                        >
                          <LuPencil />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDeleteAlert({ show: true, data: item._id })
                          }
                          className={`rounded-xl border p-2 ${isDark ? 'border-white/10 text-[#aab0c5] hover:bg-white/[0.05]' : 'border-black/10 text-[#4e5569] hover:bg-black/[0.04]'}`}
                          aria-label="Delete income"
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`py-10 text-sm ${mutedText}`}>
                    No income data available for the current filters.
                  </div>
                )}
              </div>
            </section>

            <aside className={`rounded-[28px] border p-8 ${cardClass}`}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className={`text-[13px] font-black uppercase tracking-[0.14em] ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  Monthly Pace
                </h3>
                <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${mutedText}`}>
                  Last 4 Months
                </span>
              </div>

              <div className="space-y-5">
                {monthlyPace.length ? (
                  monthlyPace.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{item.label}</p>
                        <p className="text-sm font-bold text-[#9b51e0]">
                          {format(item.amount)}
                        </p>
                      </div>
                      <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.06]'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#9b51e0] to-[#4f46e5]"
                          style={{
                            width: `${Math.max(
                              12,
                              Math.round((item.amount / maxPace) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${mutedText}`}>
                    Monthly pacing appears here once income starts coming in.
                  </p>
                )}
              </div>

              <div className={`mt-8 rounded-2xl border p-5 ${subtleSurface}`}>
                <div className={`text-[11px] uppercase tracking-[0.22em] ${mutedText}`}>
                  All-time total
                </div>
                <div className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {format(dashboardData?.totalIncome || 0)}
                </div>
                <div className={`mt-3 text-sm ${mutedText}`}>
                  Net balance: {format(dashboardData?.totalBalance || 0)}
                </div>
              </div>
            </aside>
          </div>

          <Modal
            isOpen={openAddIncomeModal}
            onClose={() => setOpenAddIncomeModal(false)}
            title="Add Income"
          >
            <AddIncomeForm onAddIncome={handleAddIncome} mode="add" variant="neon" />
          </Modal>

          <Modal
            isOpen={openEditIncomeModal}
            onClose={() => setOpenEditIncomeModal(false)}
            title="Edit Income"
          >
            <AddIncomeForm
              mode="edit"
              initial={selectedIncome}
              onUpdateIncome={handleUpdateIncome}
              variant="neon"
            />
          </Modal>

          <Modal
            isOpen={openDeleteAlert.show}
            onClose={() => setOpenDeleteAlert({ show: false, data: null })}
            title={tt('income.deleteIncome', 'Delete Income')}
          >
            <DeleteAlert
              content={tt(
                'income.deleteAlert',
                'Are you sure you want to delete this income?'
              )}
              onDelete={() => deleteIncome(openDeleteAlert.data)}
            />
          </Modal>

          <Modal
            isOpen={openBulkDeleteModal}
            onClose={() => setOpenBulkDeleteModal(false)}
            title={tt('income.bulkDeleteIncome', 'Bulk Delete Income')}
          >
            <BulkDeleteIncome
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

export default Income;
