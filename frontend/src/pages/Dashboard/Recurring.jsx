import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuPause, LuPencil, LuPlus, LuPlay, LuTrash2 } from 'react-icons/lu';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/layouts/Modal';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';
import { UserContext } from '../../context/UserContext';

const initialForm = {
  type: 'expense',
  category: 'Rent',
  source: '',
  amount: '',
  repeat: 'monthly',
  dayOfMonth: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
  isActive: true,
};

const repeatLabel = (repeat) => {
  const r = String(repeat || 'monthly').toLowerCase();
  if (r === 'weekly') return 'Weekly';
  if (r === 'yearly') return 'Yearly';
  return 'Monthly';
};

const whenText = (rule) => {
  const rep = String(rule?.repeat || 'monthly').toLowerCase();
  const start = rule?.startDate ? new Date(rule.startDate) : new Date();
  const weekday = start.toLocaleDateString(undefined, { weekday: 'long' });
  const md = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const dom = rule?.dayOfMonth || start.getDate();

  if (rep === 'weekly') return `Every ${weekday}`;
  if (rep === 'yearly') return `Every year on ${md}`;
  return `Day ${dom} each month`;
};

const nextChargeDate = (rule) => {
  const start = new Date(rule?.startDate || new Date());
  return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function RecurringPage() {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();
  const { format } = useCurrency();
  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openRuleModal, setOpenRuleModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.RECURRING.BASE);
      setRules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error(tt('recurring.loadError', 'Failed to load recurring rules'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpenRuleModal(true);
  };

  const openEdit = (rule) => {
    setEditing(rule);
    setForm({
      type: rule.type || 'expense',
      category: rule.category || '',
      source: rule.source || '',
      amount: String(rule.amount ?? ''),
      repeat: rule.repeat || 'monthly',
      dayOfMonth: rule.dayOfMonth || 1,
      startDate: String(rule.startDate || '').slice(0, 10),
      endDate: String(rule.endDate || '').slice(0, 10),
      notes: rule.notes || '',
      isActive: rule.isActive !== false,
    });
    setOpenRuleModal(true);
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const saveRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type: form.type,
        category: form.category,
        source: form.source || '',
        amount: Number(form.amount),
        repeat: String(form.repeat || 'monthly').toLowerCase(),
        dayOfMonth: Number(form.dayOfMonth || 1),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isActive: !!form.isActive,
        notes: form.notes || '',
      };

      if (editing?._id) {
        await axiosInstance.patch(`${API_PATHS.RECURRING.BASE}/${editing._id}`, body);
      } else {
        await axiosInstance.post(API_PATHS.RECURRING.BASE, body);
      }

      await axiosInstance.post(`${API_PATHS.RECURRING.BASE}/run`);
      toast.success(editing?._id ? 'Rule updated' : 'Rule created');
      setOpenRuleModal(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (id, isActive) => {
    try {
      await axiosInstance.patch(`${API_PATHS.RECURRING.BASE}/${id}/toggle`, { isActive });
      await axiosInstance.post(`${API_PATHS.RECURRING.BASE}/run`);
      await load();
    } catch {
      toast.error(tt('recurring.toggleError', 'Failed to toggle'));
    }
  };

  const removeRule = async (id) => {
    if (!window.confirm(tt('recurring.confirmDelete', 'Delete this rule?'))) return;
    try {
      await axiosInstance.delete(`${API_PATHS.RECURRING.BASE}/${id}`);
      await axiosInstance.post(`${API_PATHS.RECURRING.BASE}/run`);
      await load();
    } catch {
      toast.error(tt('recurring.deleteError', 'Failed to delete'));
    }
  };

  const monthlyCommitted = useMemo(
    () =>
      rules
        .filter((rule) => rule.isActive)
        .reduce((sum, rule) => {
          const amount = Number(rule.amount || 0);
          if (rule.repeat === 'yearly') return sum + amount / 12;
          if (rule.repeat === 'weekly') return sum + amount * 4.345;
          return sum + amount;
        }, 0),
    [rules]
  );

  const nextRule = useMemo(() => rules.find((rule) => rule.isActive) || rules[0], [rules]);
  const annualRecurring = useMemo(() => monthlyCommitted * 12, [monthlyCommitted]);
  const activeCount = rules.filter((rule) => rule.isActive).length;
  const cardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const rowClass = isDark
    ? 'border-white/8 bg-white/[0.02]'
    : 'border-black/8 bg-[rgba(17,19,27,0.03)]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-white'
    : 'border-black/10 bg-white text-[#11131b]';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.05]'
    : 'border-black/10 text-[#31374a] hover:bg-black/[0.04]';
  const surfaceBorder = isDark ? 'border-white/10' : 'border-black/10';
  const sectionDivider = isDark ? 'border-white/8' : 'border-black/8';

  return (
    <DashboardLayout activeMenu="Recurring">
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto max-w-[1600px] p-4 pt-6 md:p-8 md:pt-10">
          <div className={`mb-8 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                RECURRING
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Subscriptions and automated rules
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="rounded-2xl bg-[#d9ff34] px-6 py-3 text-sm font-black text-black hover:bg-[#cbf029]"
            >
              + Add Rule
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial from-[#8b5cf6]/20 to-transparent blur-3xl opacity-60" />
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Monthly Committed</div>
              <div className="text-5xl font-black tracking-tight text-[#8b5cf6]">{format(monthlyCommitted)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Across {activeCount} active rules</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                {activeCount} active
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Next Charge</div>
              <div className={`text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                {nextRule ? format(nextRule.amount) : format(0)}
              </div>
              <div className={`mt-3 text-sm ${mutedText}`}>
                {nextRule ? `${nextRule.category} · ${nextChargeDate(nextRule)}` : 'No active rule'}
              </div>
              <div className="mt-6 inline-flex rounded-xl bg-[#f59e0b]/10 px-4 py-2 text-sm font-bold text-[#f59e0b]">
                {nextRule ? 'Upcoming' : 'No schedule'}
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[24px] border p-8 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>Annual Recurring</div>
              <div className="text-5xl font-black tracking-tight text-[#fb7185]">{format(annualRecurring)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Projected yearly recurring cost</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#fb7185]/10 px-4 py-2 text-sm font-bold text-[#fb7185]">
                {rules.length} total rules
              </div>
            </div>
          </div>

          <section className={`mt-6 rounded-[28px] border p-8 ${cardClass}`}>
            <div className={`flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
              <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Your Rules</h2>

              <button
                type="button"
                onClick={openCreate}
                className="rounded-2xl bg-[#d9ff34] px-5 py-3 text-sm font-black text-black hover:bg-[#cbf029]"
              >
                + Add Rule
              </button>
            </div>

            <div className="space-y-4 pt-6">
              {loading ? (
                <div className={`py-10 text-sm ${mutedText}`}>Loading…</div>
              ) : rules.length === 0 ? (
                <div className={`py-10 text-sm ${mutedText}`}>No recurring rules yet.</div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule._id}
                    className={`flex flex-col gap-4 rounded-[22px] border px-5 py-5 md:flex-row md:items-center md:justify-between ${rowClass}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            rule.isActive ? 'bg-[#d9ff34]' : 'bg-[#f59e0b]'
                          }`}
                        />
                        <h3 className={`truncate text-[18px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                          {rule.type === 'income' ? 'Income' : 'Expense'} — {rule.category}
                        </h3>
                      </div>
                      <p className={`mt-2 text-sm ${mutedText}`}>
                        {format(rule.amount)} · {whenText(rule)} · Start {String(rule.startDate).slice(0, 10)} ·{' '}
                        <span className={rule.isActive ? 'text-[#d9ff34]' : 'text-[#f59e0b]'}>
                          {rule.isActive ? 'Active' : 'Paused'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className="rounded-xl bg-[#d9ff34]/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-[#d9ff34]">
                        {repeatLabel(rule.repeat)}
                      </span>
                      <span className={`text-[18px] font-black ${rule.type === 'income' ? 'text-[#d9ff34]' : 'text-[#fb7185]'}`}>
                        {rule.type === 'income' ? '+' : '-'}{format(rule.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(rule)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRule(rule._id, !rule.isActive)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                          rule.isActive
                            ? outlineButton
                            : 'border-[#d9ff34]/20 text-[#d9ff34] hover:bg-[#d9ff34]/10'
                        }`}
                      >
                        {rule.isActive ? (
                          <span className="inline-flex items-center gap-2"><LuPause /> Pause</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><LuPlay /> Resume</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRule(rule._id)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                      >
                        <span className="inline-flex items-center gap-2"><LuTrash2 /> Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <Modal
            isOpen={openRuleModal}
            onClose={() => setOpenRuleModal(false)}
            title={editing?._id ? 'Edit Rule' : 'Add Rule'}
          >
            <form onSubmit={saveRule} className={`space-y-5 rounded-[24px] border p-6 ${surfaceBorder} ${isDark ? 'bg-[#11131b] text-white' : 'bg-[#fffdf7] text-[#11131b]'}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Type</label>
                  <select value={form.type} onChange={(e) => setField('type', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Category</label>
                  <input value={form.category} onChange={(e) => setField('category', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Source</label>
                  <input value={form.source} onChange={(e) => setField('source', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Amount</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setField('amount', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Frequency</label>
                  <select value={form.repeat} onChange={(e) => setField('repeat', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Day of Month</label>
                  <input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => setField('dayOfMonth', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
              </div>

              <div className={`flex items-center justify-between border-t pt-5 ${surfaceBorder}`}>
                <label className={`inline-flex items-center gap-3 text-sm ${isDark ? 'text-[#d0d3e4]' : 'text-[#31374a]'}`}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="accent-lime-400" />
                  Active Rule
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-black ${
                    saving ? 'cursor-not-allowed bg-white/10 text-[#7b8095]' : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                  }`}
                >
                  {saving ? 'Saving...' : editing?._id ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </DashboardLayout>
  );
}
