import React, { useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';

export default function RecurringForm({ initial, onSaved, onCancel }) {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();
  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const [form, setForm] = useState(() => initial || {
    type: 'expense',
    category: 'Rent',
    source: '',
    amount: initial ? String(initial.amount ?? '') : '',
    // NEW: frequency (defaults to monthly; your engine also supports it)
    repeat: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().slice(0,10),
    endDate: '',
    timezone: 'Asia/Bangkok', // UI-only
    notes: '',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        type: form.type,
        category: form.category,
        source: form.source || '',
        amount: Number(form.amount),
        // NEW: send repeat; default to monthly for legacy docs
        repeat: (form.repeat || 'monthly').toLowerCase(),
        dayOfMonth: Number(form.dayOfMonth || 1),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isActive: !!form.isActive,
        notes: form.notes || '',
      };

      if (initial?._id) {
        await axiosInstance.patch(`${API_PATHS.RECURRING.BASE}/${initial._id}`, body);
      } else {
        await axiosInstance.post(API_PATHS.RECURRING.BASE, body);
      }

      // run generator so the new rule materializes immediately
      await axiosInstance.post(`${API_PATHS.RECURRING.BASE}/run`);

      onSaved?.();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  }

  // Common input classes
  const inputClass = `input ${isDark 
    ? 'bg-gray-700 text-gray-800 placeholder-gray-800 border-gray-600 focus:ring-2 focus:ring-purple-500' 
    : ''}`;

  const primaryBtnClass = `px-4 py-2 rounded-lg bg-purple-600 text-gray-200 font-medium 
    hover:bg-purple-500 transition-colors duration-200`;
    
  const cancelBtnClass = `px-4 py-2 rounded-lg border font-medium transition-colors duration-200
    ${isDark 
      ? 'border-gray-500 text-gray-200 hover:bg-gray-700 hover:border-gray-400' 
      : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'}`;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 p-4 rounded-2xl shadow 
      ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'}`}>
      
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          {tt('recurring.type', 'Type')}
          <select className={inputClass} value={form.type} onChange={(e)=>setField('type', e.target.value)}>
            <option value="expense">{tt('recurring.expense', 'Expense')}</option>
            <option value="income">{tt('recurring.income', 'Income')}</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.category', 'Category')}
          <input
            className={inputClass}
            value={form.category}
            onChange={(e)=>setField('category', e.target.value)}
            placeholder={tt('recurring.categoryPlaceholder', 'Rent / Salary / Loan Payment')}
          />
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.source', 'Source')}
          <input
            className={inputClass}
            value={form.source||''}
            onChange={(e)=>setField('source', e.target.value)}
            placeholder={tt('recurring.sourcePlaceholder', 'Employer / Bank / Landlord')}
          />
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.amountPerMonth', 'Amount (per month)')}
          <input
            className={inputClass}
            type="number"
            min={0}
            value={form.amount}
            onChange={(e)=>setField('amount', Number(e.target.value))}
          />
        </label>

        {/* NEW: Frequency selector */}
        <label className="flex flex-col text-sm">
          {tt('recurring.frequency', 'Frequency')}
          <select
            className={inputClass}
            value={form.repeat || 'monthly'}
            onChange={(e)=>setField('repeat', e.target.value)}
          >
            <option value="weekly">{tt('recurring.weekly', 'Weekly')}</option>
            <option value="monthly">{tt('recurring.monthly', 'Monthly')}</option>
            <option value="yearly">{tt('recurring.yearly', 'Yearly')}</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.dayOfMonth', 'Day of Month')}
          <input
            className={inputClass}
            type="number"
            min={1}
            max={31}
            value={form.dayOfMonth}
            onChange={(e)=>setField('dayOfMonth', Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.startDate', 'Start Date')}
          <input
            className={inputClass}
            type="date"
            value={form.startDate?.slice(0,10)}
            onChange={(e)=>setField('startDate', e.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.endDate', 'End Date (optional)')}
          <input
            className={inputClass}
            type="date"
            value={form.endDate?.slice(0,10)}
            onChange={(e)=>setField('endDate', e.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm">
          {tt('recurring.timezone', 'Timezone')}
          <input
            className={inputClass}
            value={form.timezone}
            onChange={(e)=>setField('timezone', e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col text-sm">
        {tt('recurring.notes', 'Notes')}
        <textarea
          className={inputClass}
          value={form.notes||''}
          onChange={(e)=>setField('notes', e.target.value)}
        />
      </label>

      <div className="flex items-center gap-3">
        <button disabled={saving} className={primaryBtnClass}>
          {initial?._id
            ? tt('recurring.saveChanges', 'Save Changes')
            : tt('recurring.createRule', 'Create Rule')}
        </button>
        <button type="button" className={cancelBtnClass} onClick={onCancel}>
          {tt('recurring.cancel', 'Cancel')}
        </button>
      </div>
    </form>
  );
}
