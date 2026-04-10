import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuPause, LuPencil, LuPlus, LuPlay, LuTrash2 } from 'react-icons/lu';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/layout/Modal';
import CategorySelect from '../../components/common/CategorySelect';
import EmojiPickerPopup from '../../components/layout/EmojiPickerPopup';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';
import { UserContext } from '../../context/UserContext';

const initialForm = {
  type: 'expense',
  categoryId: '',
  category: 'Rent',
  source: '',
  icon: '💸',
  amount: '',
  repeat: 'monthly',
  dayOfMonth: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
  isActive: true,
};

const repeatLabel = (repeat, tt) => {
  const r = String(repeat || 'monthly').toLowerCase();
  if (r === 'weekly') return tt('recurring.weekly', 'Weekly');
  if (r === 'yearly') return tt('recurring.yearly', 'Yearly');
  return tt('recurring.monthly', 'Monthly');
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

const nextChargeDate = (rule, locale = 'en-US') => {
  const start = new Date(rule?.startDate || new Date());
  return start.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
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
      categoryId: rule.categoryId || '',
      category: rule.category || '',
      source: rule.source || '',
      icon: rule.icon || (rule.type === 'income' ? '💰' : '💸'),
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
        categoryId: form.categoryId || undefined,
        category: form.category,
        source: form.source || '',
        icon: form.icon || '',
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
  const pageClass = isDark
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.11),transparent_26%),radial-gradient(circle_at_top_right,rgba(71,215,255,0.08),transparent_22%),linear-gradient(180deg,#090b11_0%,#05070b_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_20%),linear-gradient(180deg,#fefbf8_0%,#f7f3ea_100%)] text-[#11131b]';
  const cardClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/18 bg-white/14 text-[#11131b] shadow-[0_28px_90px_rgba(15,23,42,0.11)] ring-1 ring-white/45 backdrop-blur-3xl';
  const rowClass = isDark
    ? 'border-white/10 bg-white/[0.06]'
    : 'border-white/16 bg-white/12 backdrop-blur-3xl';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white placeholder:text-[#848aa0]'
    : 'border-white/16 bg-white/12 text-[#11131b] placeholder:text-[#8a8f9f] backdrop-blur-3xl';
  const mutedText = isDark ? 'text-[#7b8095]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#8a90a7]' : 'text-[#6b7080]';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.08] backdrop-blur-2xl'
    : 'border-white/16 text-[#31374a] hover:bg-white/22 backdrop-blur-3xl';
  const surfaceBorder = isDark ? 'border-white/10' : 'border-white/16';
  const sectionDivider = isDark ? 'border-white/10' : 'border-white/16';

  return (
    <DashboardLayout activeMenu="Recurring">
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
                {tt('menu.recurring', 'RECURRING')}
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('recurring.subtitle', 'Subscriptions and automated rules')}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
                isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
              }`}
            >
              {tt('recurring.add', 'Add Rule')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-radial from-[#8b5cf6]/20 to-transparent blur-3xl opacity-80" />
              <div className={`pointer-events-none absolute inset-0 ${isDark ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent)]' : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.30),transparent_36%,transparent)]'}`} />
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('recurring.monthlyCommitted', 'Monthly Committed')}</div>
              <div className="text-4xl font-black tracking-tight text-[#8b5cf6]">{format(monthlyCommitted)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Across {activeCount} active rules</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#8b5cf6]/10 px-4 py-2 text-sm font-bold text-[#8b5cf6]">
                {activeCount} active
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('recurring.nextCharge', 'Next Charge')}</div>
              <div className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                {nextRule ? format(nextRule.amount) : format(0)}
              </div>
              <div className={`mt-3 text-sm ${mutedText}`}>
                {nextRule ? `${nextRule.category} · ${nextChargeDate(nextRule)}` : 'No active rule'}
              </div>
              <div className="mt-6 inline-flex rounded-xl bg-[#f59e0b]/10 px-4 py-2 text-sm font-bold text-[#f59e0b]">
                {nextRule ? 'Upcoming' : 'No schedule'}
              </div>
            </div>

            <div className={`relative overflow-hidden rounded-[22px] border p-6 ${cardClass}`}>
              <div className={`mb-4 text-[11px] font-bold uppercase tracking-[0.28em] ${labelText}`}>{tt('recurring.annualRecurring', 'Annual Recurring')}</div>
              <div className="text-4xl font-black tracking-tight text-[#fb7185]">{format(annualRecurring)}</div>
              <div className={`mt-3 text-sm ${mutedText}`}>Projected yearly recurring cost</div>
              <div className="mt-6 inline-flex rounded-xl bg-[#fb7185]/10 px-4 py-2 text-sm font-bold text-[#fb7185]">
                {rules.length} total rules
              </div>
            </div>
          </div>

          <section className={`mt-5 rounded-[24px] border p-6 ${cardClass}`}>
              <div className={`flex flex-col gap-3 border-b pb-5 lg:flex-row lg:items-center lg:justify-between ${sectionDivider}`}>
              <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('recurring.yourRules', 'Your Rules')}</h2>

              <button
                type="button"
                onClick={openCreate}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${
                  isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
                }`}
              >
                {tt('recurring.add', 'Add Rule')}
              </button>
            </div>

            <div className="space-y-4 pt-5">
              {loading ? (
                <div className={`py-10 text-sm ${mutedText}`}>{tt('common.loading', 'Loading…')}</div>
              ) : rules.length === 0 ? (
                <div className={`py-10 text-sm ${mutedText}`}>{tt('recurring.noRules', 'No recurring rules yet.')}</div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule._id}
                  className={`flex flex-col gap-4 rounded-[22px] border px-5 py-5 md:flex-row md:items-center md:justify-between backdrop-blur-3xl ${rowClass}`}
                  >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          rule.isActive ? (isDark ? 'bg-[#d9ff34]' : 'bg-[#84cc16]') : 'bg-[#f59e0b]'
                        }`}
                      />
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl border text-base ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-white/22 bg-white/18 backdrop-blur-3xl'}`}>
                        {rule.icon || (rule.type === 'income' ? '💰' : '💸')}
                      </span>
                      <h3 className={`truncate text-[18px] font-medium ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                        {rule.type === 'income' ? tt('recurring.income', 'Income') : tt('recurring.expense', 'Expense')} — {rule.category}
                      </h3>
                    </div>
                      <p className={`mt-2 text-sm ${mutedText}`}>
                        {format(rule.amount)} · {whenText(rule)} · Start {String(rule.startDate).slice(0, 10)} ·{' '}
                        <span className={rule.isActive ? (isDark ? 'text-[#d9ff34]' : 'text-[#84cc16]') : 'text-[#f59e0b]'}>
                          {rule.isActive ? tt('recurring.active', 'Active') : tt('recurring.paused', 'Paused')}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className={`rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] ${
                        isDark ? 'bg-[#d9ff34]/10 text-[#d9ff34]' : 'bg-[#84cc16]/10 text-[#84cc16]'
                      }`}>
                        {repeatLabel(rule.repeat, tt)}
                      </span>
                      <span className={`text-[18px] font-black ${rule.type === 'income' ? 'text-[#d9ff34]' : 'text-[#fb7185]'}`}>
                        {rule.type === 'income' ? '+' : '-'}{format(rule.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(rule)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${outlineButton}`}
                      >
                        {tt('common.edit', 'Edit')}
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
                        <span className="inline-flex items-center gap-2"><LuTrash2 /> {tt('common.delete', 'Delete')}</span>
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
            title={editing?._id ? tt('recurring.editRule', 'Edit Rule') : tt('recurring.addRule', 'Add Rule')}
          >
            <form onSubmit={saveRule} className={`space-y-5 rounded-[24px] border p-6 ${surfaceBorder} ${isDark ? 'bg-white/[0.05] text-white' : 'bg-white/18 text-[#11131b] backdrop-blur-3xl'}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.type', 'Type')}</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setField('type', nextType);
                      setField('categoryId', '');
                      setField('category', nextType === 'income' ? 'Uncategorized' : 'Uncategorized');
                      setField('icon', nextType === 'income' ? '💰' : '💸');
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  >
                    <option value="expense">{tt('recurring.expense', 'Expense')}</option>
                    <option value="income">{tt('recurring.income', 'Income')}</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.category', 'Category')}</label>
                  <CategorySelect
                    type={form.type}
                    value={form.categoryId}
                    isDark={isDark}
                    onChange={(id, name) => {
                      setField('categoryId', id);
                      setField('category', name || 'Uncategorized');
                    }}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.source', 'Source')}</label>
                  <input value={form.source} onChange={(e) => setField('source', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.amount', 'Amount')}</label>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setField('amount', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.icon', 'Icon')}</label>
                  <div className={`rounded-2xl border px-4 py-3 ${inputClass}`}>
                    <EmojiPickerPopup icon={form.icon} onSelect={(emoji) => setField('icon', emoji)} />
                  </div>
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.frequency', 'Frequency')}</label>
                  <select value={form.repeat} onChange={(e) => setField('repeat', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}>
                    <option value="weekly">{tt('recurring.weekly', 'Weekly')}</option>
                    <option value="monthly">{tt('recurring.monthly', 'Monthly')}</option>
                    <option value="yearly">{tt('recurring.yearly', 'Yearly')}</option>
                  </select>
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.dayOfMonth', 'Day of Month')}</label>
                  <input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => setField('dayOfMonth', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.startDate', 'Start Date')}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.endDate', 'End Date')}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>{tt('recurring.notes', 'Notes')}</label>
                <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`} />
              </div>

              <div className={`flex items-center justify-between border-t pt-5 ${surfaceBorder}`}>
                <label className={`inline-flex items-center gap-3 text-sm ${isDark ? 'text-[#d0d3e4]' : 'text-[#31374a]'}`}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="accent-lime-400" />
                  {tt('recurring.activeRule', 'Active Rule')}
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-2xl px-5 py-3 text-sm font-black ${
                    saving ? 'cursor-not-allowed bg-white/10 text-[#7b8095]' : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                  }`}
                >
                  {saving ? tt('common.saving', 'Saving...') : editing?._id ? tt('recurring.saveChanges', 'Save Changes') : tt('recurring.createRule', 'Create Rule')}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </DashboardLayout>
  );
}
