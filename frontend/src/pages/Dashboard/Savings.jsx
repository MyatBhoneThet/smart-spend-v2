import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuCalendarDays, LuPlus, LuTrash2 } from 'react-icons/lu';
import DashboardLayout from '../../components/layouts/DashboardLayout';
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
  const cardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const sectionDivider = isDark ? 'border-white/8' : 'border-black/8';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-white'
    : 'border-black/10 bg-white text-[#11131b]';
  const subtleSurface = isDark
    ? 'border-white/10 bg-white/[0.03]'
    : 'border-black/10 bg-[rgba(17,19,27,0.03)]';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.05]'
    : 'border-black/10 text-[#31374a] hover:bg-black/[0.04]';

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
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto max-w-[1600px] p-4 pt-6 md:p-8 md:pt-10">
          <div className={`mb-8 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SAVINGS
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Goals and progress
              </p>
            </div>

            <button
              type="button"
              onClick={() => document.getElementById('create-goal-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-2xl bg-[#d9ff34] px-6 py-3 text-sm font-black text-black hover:bg-[#cbf029]"
            >
              + New Goal
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial from-[#d9ff34]/20 to-transparent blur-3xl opacity-60" />
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Total Saved</div>
              <div className="text-5xl font-black tracking-tight text-[#d9ff34]">{format(totalSaved)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Across {activeGoals.length} goals</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#d9ff34]/10 px-4 py-2 text-sm font-bold text-[#d9ff34]">
                {activeGoals.length} goals active
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Reserved This Month</div>
              <div className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{format(reservedThisMonth)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Auto-allocated fixed amount</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                {activeGoals.filter((goal) => goal.autoAllocate?.enabled).length} auto-allocate enabled
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Nearest Deadline</div>
              <div className="text-5xl font-black tracking-tight text-[#fbbf24]">
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

          <div className="mt-8">
            <div className={`mb-6 text-[13px] font-black uppercase tracking-[0.22em] ${labelText}`}>
              Goals Overview
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {goalCards.length ? (
                goalCards.map((goal) => (
                  <div
                    key={goal._id}
                    className={`rounded-[28px] border p-6 ${cardClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-[18px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{goal.title}</h3>
                        <p className={`mt-1 text-sm ${mutedText}`}>
                          {format(goal.saved)} saved of {format(goal.target)} target
                        </p>
                      </div>
                      <div className="text-4xl font-black" style={{ color: goal.color }}>
                        {goal.pct}%
                      </div>
                    </div>

                    <div className={`mt-5 h-2 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.06]'}`}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${goal.pct}%`,
                          background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)`,
                        }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className="rounded-xl px-4 py-2 text-sm font-bold"
                          style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                        >
                          {goal.targetDate ? `Due ${formatDeadlineLabel(goal.targetDate)}` : 'No deadline'}
                        </span>
                        {goal.autoAllocate?.enabled && (
                          <span className="rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                            Auto allocate
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeGoal(goal._id)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                      >
                        <span className="inline-flex items-center gap-2"><LuTrash2 /> Delete</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fundGoal(goal._id)}
                      className="mt-6 w-full rounded-2xl bg-[#d9ff34] px-5 py-4 text-sm font-black text-black hover:bg-[#cbf029]"
                    >
                      + Add to Goal
                    </button>
                  </div>
                ))
              ) : (
                <div className={`col-span-full py-10 text-sm ${mutedText}`}>
                  No goals yet. Create one below.
                </div>
              )}
            </div>
          </div>

          <section
            id="create-goal-form"
            className={`mt-6 rounded-[28px] border p-8 ${cardClass}`}
          >
            <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Create New Goal</h2>

            <form onSubmit={createGoal} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Goal Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Buy MacBook"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Target Amount (THB)</label>
                  <input
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Target Date</label>
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
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Linked Jar</label>
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
                  <label className={`mb-3 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Label Color</label>
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
                  <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Enable auto-allocate on income</div>
                  <p className={`mt-1 text-sm ${labelText}`}>
                    Auto-allocate a portion of each income into this goal.
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <select
                      value={aaType}
                      onChange={(e) => setAaType(e.target.value)}
                      className={`rounded-2xl border bg-transparent px-4 py-3 outline-none ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-[#11131b]'}`}
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed</option>
                    </select>
                    <input
                      value={aaValue}
                      onChange={(e) => setAaValue(e.target.value)}
                      className={`w-24 rounded-2xl border bg-transparent px-4 py-3 outline-none ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-[#11131b]'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setAaEnabled((prev) => !prev)}
                      className={`relative h-10 w-20 rounded-full transition-colors ${aaEnabled ? 'bg-[#d9ff34]' : isDark ? 'bg-white/10' : 'bg-black/10'}`}
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
                    : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                }`}
              >
                {creating ? 'Creating...' : '✦ Create Goal'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
