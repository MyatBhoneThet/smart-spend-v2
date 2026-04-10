import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuArrowDown, LuArrowUp, LuCalendarDays, LuPlus, LuTrash2, LuWallet } from 'react-icons/lu';
import DashboardLayout from '../../components/layout/DashboardLayout';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';
import { UserContext } from '../../context/UserContext';

const GOAL_COLORS = ['#d9ff34', '#8b5cf6', '#ff4d6d', '#fbbf24', '#47d7ff'];

const formatDeadlineLabel = (value) => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export default function SavingsPage() {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();
  const { format } = useCurrency();
  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const [goals, setGoals] = useState([]);
  const [jars, setJars] = useState([]);
  const [newJarName, setNewJarName] = useState('');
  const [creatingJar, setCreatingJar] = useState(false);
  const [jarAmounts, setJarAmounts] = useState({});
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [jarId, setJarId] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [aaEnabled, setAaEnabled] = useState(false);
  const [aaType, setAaType] = useState('percent');
  const [aaValue, setAaValue] = useState('10');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const [{ data: gs }, { data: js }] = await Promise.all([
        axiosInstance.get(API_PATHS.GOALS.BASE),
        axiosInstance.get(API_PATHS.JARS.BASE),
      ]);
      const goalList = Array.isArray(gs) ? gs : [];
      const jarList = Array.isArray(js) ? js : [];
      setGoals(goalList);
      setJars(jarList);
      if (!jarId && jarList[0]) setJarId(jarList[0]._id);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to load goals/jars');
    }
  };

  const createJar = async (e) => {
    e.preventDefault();
    if (!newJarName.trim()) return;
    try {
      setCreatingJar(true);
      await axiosInstance.post(API_PATHS.JARS.BASE, { name: newJarName.trim() });
      setNewJarName('');
      toast.success('Jar created');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create jar');
    } finally {
      setCreatingJar(false);
    }
  };

  const changeJarAmount = (id, value) => {
    setJarAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const fundJar = async (id) => {
    const amount = Number(jarAmounts[id] || 0);
    if (!(amount > 0)) return;
    try {
      await axiosInstance.post(API_PATHS.JARS.FUND(id), { amount });
      changeJarAmount(id, '');
      toast.success('Jar funded');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Fund failed');
    }
  };

  const withdrawJar = async (id) => {
    const amount = Number(jarAmounts[id] || 0);
    if (!(amount > 0)) return;
    try {
      await axiosInstance.post(API_PATHS.JARS.WITHDRAW(id), { amount });
      changeJarAmount(id, '');
      toast.success('Jar withdrawn');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Withdraw failed');
    }
  };

  const removeJar = async (id, balance) => {
    if (balance > 0) {
      toast.error('You can only delete an empty jar. Withdraw to 0 first.');
      return;
    }
    if (!window.confirm('Delete this jar? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`${API_PATHS.JARS.BASE}/${id}`);
      toast.success('Jar deleted');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const goalCards = useMemo(
    () =>
      goals.map((goal, index) => {
        const saved = Number(goal.currentAmount || 0);
        const target = Math.max(1, Number(goal.targetAmount || 0));
        const pct = Math.min(100, Math.round((saved / target) * 100));
        return {
          ...goal,
          saved,
          target,
          pct,
          color: GOAL_COLORS[index % GOAL_COLORS.length],
        };
      }),
    [goals]
  );

  const activeGoals = goalCards.filter((goal) => goal.status !== 'achieved' && goal.status !== 'expired');
  const totalSaved = goalCards.reduce((sum, goal) => sum + goal.saved, 0);
  const reservedThisMonth = activeGoals
    .filter((goal) => goal.autoAllocate?.enabled)
    .reduce((sum, goal) => {
      if (goal.autoAllocate?.type === 'fixed') return sum + Number(goal.autoAllocate?.value || 0);
      return sum + 0;
    }, 0);
  const nearestDeadline = activeGoals
    .filter((goal) => goal.targetDate)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))[0];
  const pageClass = isDark
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.11),transparent_26%),radial-gradient(circle_at_top_right,rgba(71,215,255,0.08),transparent_22%),linear-gradient(180deg,#090b11_0%,#05070b_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_20%),linear-gradient(180deg,#fefbf8_0%,#f7f3ea_100%)] text-[#11131b]';
  const cardClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#11131b] shadow-[0_24px_90px_rgba(15,23,42,0.08)] ring-1 ring-white/45 backdrop-blur-3xl';
  const sectionDivider = isDark ? 'border-white/10' : 'border-white/45';
  const mutedText = isDark ? 'text-[#7b8095]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#8a90a7]' : 'text-[#6b7080]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white placeholder:text-[#848aa0]'
    : 'border-white/28 bg-white/28 text-[#11131b] placeholder:text-[#8a8f9f] backdrop-blur-3xl';
  const subtleSurface = isDark
    ? 'border-white/10 bg-white/[0.05]'
    : 'border-white/28 bg-white/22 backdrop-blur-3xl';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 text-[#31374a] hover:bg-white/42 backdrop-blur-3xl';

  const createGoal = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || !targetDate || !jarId) return;
    try {
      setCreating(true);
      await axiosInstance.post(API_PATHS.GOALS.BASE, {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        targetDate,
        jarId,
        autoAllocate: { enabled: aaEnabled, type: aaType, value: Number(aaValue) },
      });
      setTitle('');
      setTargetAmount('');
      setTargetDate('');
      setAaEnabled(false);
      setAaType('percent');
      setAaValue('10');
      toast.success('Goal created');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const fundGoal = async (id) => {
    const raw = window.prompt('Amount to add to this goal (THB):', '500');
    const amount = Number(raw || 0);
    if (!amount || amount <= 0) return;
    try {
      const { data } = await axiosInstance.post(API_PATHS.GOALS.FUND(id), { amount });
      toast.success(data?.message || 'Goal funded');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Fund failed');
    }
  };

  const removeGoal = async (id) => {
    if (!window.confirm('Delete this goal? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`${API_PATHS.GOALS.BASE}/${id}`);
      toast.success('Goal deleted');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <DashboardLayout activeMenu="Savings">
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${pageClass}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -left-20 top-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-[#d9ff34]/10' : 'bg-[#d9ff34]/18'}`} />
          <div className={`absolute right-6 top-40 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-[#fb7185]/8' : 'bg-[#fb7185]/10'}`} />
          <div className={`absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full blur-3xl ${isDark ? 'bg-[#47d7ff]/8' : 'bg-white/50'}`} />
        </div>
        <div className="relative mx-auto max-w-[1320px] p-4 pt-4 md:p-5 md:pt-6">
          <div className={`mb-6 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-[0.18em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {tt('menu.savings', 'SAVINGS')}
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('savings.subtitle', 'Goals and progress')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => document.getElementById('create-goal-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
              }`}
            >
              {tt('savings.newGoal', '+ New Goal')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial to-transparent blur-3xl opacity-60 ${isDark ? 'from-[#d9ff34]/20' : 'from-[#84cc16]/20'}`} />
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('savings.totalSaved', 'Total Saved')}</div>
              <div className={`text-4xl font-black tracking-tight ${isDark ? 'text-[#d9ff34]' : 'text-[#84cc16]'}`}>{format(totalSaved)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Across {activeGoals.length} goals</div>
              <div className={`mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-bold ${isDark ? 'bg-[#d9ff34]/10 text-[#d9ff34]' : 'bg-[#84cc16]/10 text-[#84cc16]'}`}>
                {activeGoals.length} goals active
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('savings.reservedThisMonth', 'Reserved This Month')}</div>
              <div className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(reservedThisMonth)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Auto-allocated fixed amount</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                {activeGoals.filter((goal) => goal.autoAllocate?.enabled).length} auto-allocate enabled
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('savings.nearestDeadline', 'Nearest Deadline')}</div>
              <div className="text-4xl font-black tracking-tight text-[#fbbf24]">
                {nearestDeadline ? formatDeadlineLabel(nearestDeadline.targetDate) : '—'}
              </div>
              <div className={`mt-3 text-sm ${mutedText}`}>
                {nearestDeadline ? nearestDeadline.title : 'No dated goal'}
              </div>
              <div className="mt-6 inline-flex rounded-xl bg-[#fbbf24]/10 px-4 py-2 text-sm font-bold text-[#fbbf24]">
                {nearestDeadline ? 'Upcoming target' : 'No deadline'}
              </div>
            </div>
          </div>

          <section className={`mt-6 rounded-[24px] border p-6 ${cardClass}`}>
            <div className={`flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between ${sectionDivider}`}>
              <div>
                <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('saving.jars', 'Jars')}</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>{tt('saving.jarsDesc', 'Separate buckets for savings, goals, and transfers.')}</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${isDark ? 'border-white/10 bg-white/[0.03] text-white' : 'border-black/10 bg-white text-[#11131b]'}`}>
                <LuWallet className={labelText} />
                {jars.length} {tt('saving.jarCount', 'jars')}
              </div>
            </div>

            <form onSubmit={createJar} className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                  {tt('saving.newJarName', 'New Jar Name')}
                </label>
                <input
                  value={newJarName}
                  onChange={(e) => setNewJarName(e.target.value)}
                  placeholder={tt('saving.jarPlaceholder', 'e.g. Emergency Fund')}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                />
              </div>
              <button
                type="submit"
                disabled={creatingJar || !newJarName.trim()}
                className={`rounded-2xl px-5 py-3 text-sm font-black ${
                  creatingJar || !newJarName.trim()
                    ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                    : isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
                }`}
              >
                {creatingJar ? tt('common.creating', 'Creating...') : tt('saving.addJar', 'Add Jar')}
              </button>
            </form>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jars.map((jar) => {
                const amount = jarAmounts[jar._id] || '';
                const balance = Number(jar.balance || 0);
                return (
                  <div key={jar._id} className={`rounded-[22px] border p-5 ${isDark ? 'border-white/8 bg-white/[0.02]' : 'border-black/8 bg-[rgba(17,19,27,0.03)]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${isDark ? 'bg-white/[0.05]' : 'bg-white'}`}>
                          <LuWallet />
                        </div>
                        <div>
                          <div className={`text-[16px] font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{jar.name}</div>
                          <div className={`text-xs uppercase tracking-[0.18em] ${mutedText}`}>{jar.isPrimary ? tt('saving.primaryJar', 'Primary jar') : tt('saving.jar', 'Jar')}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeJar(jar._id, balance)}
                        className={`rounded-xl border p-2 ${balance > 0 ? 'cursor-not-allowed opacity-50' : outlineButton}`}
                        title={balance > 0 ? 'Withdraw to 0 before delete' : 'Delete jar'}
                      >
                        <LuTrash2 />
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className={`text-[11px] uppercase tracking-[0.2em] ${labelText}`}>{tt('saving.balance', 'Balance')}</div>
                      <div className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(balance)}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3">
                      <input
                        value={amount}
                        onChange={(e) => changeJarAmount(jar._id, e.target.value)}
                        placeholder={tt('saving.amount', 'Amount (THB)')}
                        className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fundJar(jar._id)}
                          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'}`}
                        >
                          <span className="inline-flex items-center gap-2"><LuArrowUp /> {tt('saving.fund', 'Fund')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => withdrawJar(jar._id)}
                          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${isDark ? 'bg-white/10 text-white hover:bg-white/[0.14]' : 'bg-black/5 text-[#11131b] hover:bg-black/10'}`}
                        >
                          <span className="inline-flex items-center gap-2"><LuArrowDown /> {tt('saving.withdraw', 'Withdraw')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {jars.length === 0 && (
                <div className={`col-span-full py-8 text-sm ${mutedText}`}>
                  {tt('saving.noJars', 'No jars yet. Create one above.')}
                </div>
              )}
            </div>
          </section>

          <div className="mt-6">
            <div className={`mb-5 text-[13px] font-black uppercase tracking-[0.2em] ${labelText}`}>
              {tt('savings.goalsOverview', 'Goals Overview')}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              {goalCards.length ? (
                goalCards.map((goal) => (
                  <div
                    key={goal._id}
                    className={`rounded-[24px] border p-5 ${cardClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-[17px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{goal.title}</h3>
                        <p className={`mt-1 text-sm ${mutedText}`}>
                          {format(goal.saved)} {tt('savings.savedOf', 'saved of')} {format(goal.target)} {tt('savings.target', 'target')}
                        </p>
                      </div>
                      <div className="text-3xl font-black" style={{ color: goal.color }}>
                        {goal.pct}%
                      </div>
                    </div>

                    <div className={`mt-4 h-2 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.06]'}`}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${goal.pct}%`,
                          background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="rounded-xl px-4 py-2 text-sm font-bold"
                          style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                        >
                          {goal.targetDate ? `${tt('savings.due', 'Due')} ${formatDeadlineLabel(goal.targetDate)}` : tt('savings.noDeadline', 'No deadline')}
                        </span>
                        {goal.autoAllocate?.enabled && (
                          <span className="rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                            {tt('savings.autoAllocate', 'Auto allocate')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeGoal(goal._id)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                      >
                        <span className="inline-flex items-center gap-2"><LuTrash2 /> {tt('common.delete', 'Delete')}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fundGoal(goal._id)}
                      className={`mt-5 w-full rounded-2xl px-5 py-3 text-sm font-black transition-all ${
                        isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
                      }`}
                    >
                      {tt('savings.addToGoal', '+ Add to Goal')}
                    </button>
                  </div>
                ))
              ) : (
                <div className={`col-span-full py-10 text-sm ${mutedText}`}>
                  {tt('savings.noGoals', 'No goals yet. Create one below.')}
                </div>
              )}
            </div>
          </div>

          <section
            id="create-goal-form"
            className={`mt-5 rounded-[24px] border p-6 ${cardClass}`}
          >
            <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('savings.createNewGoal', 'Create New Goal')}</h2>

            <form onSubmit={createGoal} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('savings.goalTitle', 'Goal Title')}</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Buy MacBook"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('savings.targetAmount', 'Target Amount (THB)')}</label>
                  <input
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('savings.targetDate', 'Target Date')}</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 pr-12 outline-none ${inputClass}`}
                    />
                    <LuCalendarDays className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${labelText}`} />
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('savings.linkedJar', 'Linked Jar')}</label>
                  <select
                    value={jarId}
                    onChange={(e) => setJarId(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  >
                    {jars.map((jar) => (
                      <option key={jar._id} value={jar._id}>
                        {jar.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <label className={`mb-3 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('savings.labelColor', 'Label Color')}</label>
                  <div className="flex flex-wrap gap-3">
                    {GOAL_COLORS.map((color, index) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setColorIndex(index)}
                        className={`h-11 w-11 rounded-2xl border-2 ${colorIndex === index ? (isDark ? 'border-white' : 'border-[#11131b]') : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className={`rounded-[22px] border p-5 ${subtleSurface}`}>
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('savings.enableAutoAllocate', 'Enable auto-allocate on income')}</div>
                  <p className={`mt-1 text-sm ${labelText}`}>
                    {tt('savings.autoAllocateDescription', 'Auto-allocate a portion of each income into this goal.')}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <select
                      value={aaType}
                      onChange={(e) => setAaType(e.target.value)}
                      className={`rounded-2xl border bg-transparent px-4 py-3 outline-none ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-[#11131b]'}`}
                    >
                      <option value="percent">{tt('savings.percent', 'Percent')}</option>
                      <option value="fixed">{tt('savings.fixed', 'Fixed')}</option>
                    </select>
                    <input
                      value={aaValue}
                      onChange={(e) => setAaValue(e.target.value)}
                      className={`w-24 rounded-2xl border bg-transparent px-4 py-3 outline-none ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-[#11131b]'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setAaEnabled((prev) => !prev)}
                      className={`relative h-10 w-20 rounded-full transition-colors ${aaEnabled ? (isDark ? 'bg-[#d9ff34]' : 'bg-[#84cc16]') : isDark ? 'bg-white/10' : 'bg-black/10'}`}
                    >
                      <span
                        className={`absolute top-1 h-8 w-8 rounded-full bg-white transition-transform ${aaEnabled ? 'translate-x-10' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className={`rounded-2xl px-6 py-4 text-sm font-black ${
                  creating
                    ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                    : isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
                }`}
              >
                {creating ? tt('common.creating', 'Creating...') : tt('savings.createGoal', '✦ Create Goal')}
              </button>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
