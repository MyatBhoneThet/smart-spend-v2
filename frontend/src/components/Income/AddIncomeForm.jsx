import React, { useContext, useEffect, useState } from 'react';
import EmojiPickerPopup from '../layouts/EmojiPickerPopup';
import CategorySelect from '../common/CategorySelect';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import { useCurrency } from '../../context/CurrencyContext';

const AddIncomeForm = ({
  onAddIncome,
  onUpdateIncome,
  mode = 'add',
  initial = null,
  variant = 'default',
}) => {
  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };
  const { prefs } = useContext(UserContext);
  const isDarkTheme = prefs?.theme === 'dark';
  const isNeon = variant === 'neon';

  const { targetCurrency, symbol, toBase, format, convert } = useCurrency();

  const [income, setIncome] = useState({
    source: '', categoryId: '', categoryName: 'Uncategorized',
    amount: '', date: '', icon: '💰',
  });

  useEffect(() => {
    if (mode === 'edit' && initial) {
      const displayAmount = convert(initial.amount || 0, targetCurrency);
      setIncome({
        source: initial.source || '',
        categoryId: initial.categoryId || '',
        categoryName: initial.categoryName || initial.category || 'Uncategorized',
        amount: String(displayAmount || ''),
        date: initial.date ? String(initial.date).slice(0,10) : '',
        icon: initial.icon || '💰',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initial, targetCurrency]);

  const setField = (k, v) => setIncome((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!income.source || !income.amount || !income.date) return;

    const baseTHB = toBase(parseFloat(income.amount) || 0, targetCurrency);

    const payload = {
      ...income,
      amount: Number.isFinite(baseTHB) ? Number(baseTHB.toFixed(2)) : 0,
    };

    if (mode === 'edit') onUpdateIncome?.(payload);
    else onAddIncome?.(payload);

    setIncome({ source: '', categoryId: '', categoryName: 'Uncategorized', amount: '', date: '', icon: '💰' });
  };

  const isFormValid = !!(income.source && income.amount && income.date);
  const basePreview = toBase(parseFloat(income.amount) || 0, targetCurrency);

  if (isNeon) {
    const fieldClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#6c7086] outline-none focus:border-[#d9ff34]/30 focus:ring-2 focus:ring-[#d9ff34]/10';

    return (
      <div className="rounded-[24px] border border-white/10 bg-[#11131b] p-6 text-white">
        <div className="mb-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6c7086]">
            {mode === 'edit' ? 'Edit Income' : 'New Income'}
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">
            {mode === 'edit' ? tt('income.editIncome', 'Edit Income') : tt('income.addNewIncome', 'Add New Income')}
          </h2>
          <p className="mt-2 text-sm text-[#7b8095]">
            Enter amounts in {targetCurrency}. Values are saved in THB.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8095]">Icon</label>
            <EmojiPickerPopup icon={income.icon} onSelect={(e) => setField('icon', e)} isDark />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8095]">Income Source</label>
            <input
              value={income.source}
              onChange={(e) => setField('source', e.target.value)}
              placeholder="e.g., Salary, Freelance"
              type="text"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8095]">Category</label>
            <CategorySelect
              type="income"
              value={income.categoryId}
              isDark
              onChange={(id, name) => {
                setField('categoryId', id);
                setField('categoryName', name || 'Uncategorized');
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8095]">
                Amount ({targetCurrency})
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-3 text-sm font-semibold text-[#aab0c5]">
                  {symbol()}
                </span>
                <input
                  value={income.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${fieldClass} pl-12`}
                />
              </div>
              {!!income.amount && (
                <div className="mt-2 text-xs text-[#7b8095]">
                  Saved as {format(basePreview, 'THB')} (THB)
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8095]">Date</label>
              <input
                value={income.date}
                onChange={(e) => setField('date', e.target.value)}
                type="date"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div className="text-xs text-[#7b8095]">
              {isFormValid ? 'Ready to save' : tt('income.fillRequired', 'Please fill in all required fields')}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`rounded-2xl px-5 py-3 text-sm font-black ${
                isFormValid
                  ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                  : 'cursor-not-allowed bg-white/10 text-[#7b8095]'
              }`}
            >
              {mode === 'edit' ? tt('income.updateIncome', 'Update Income') : tt('income.addIncome', 'Add Income')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = `w-full px-3 py-3 rounded-lg text-sm border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
    isDarkTheme
      ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
      : 'bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20'
  }`;

  return (
    <div className={`relative overflow-hidden ${isDarkTheme ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-green-50 to-emerald-50'} rounded-2xl shadow-2xl border ${isDarkTheme ? 'border-gray-700/50' : 'border-white/20'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`${isDarkTheme ? 'bg-blue-600/10' : 'bg-green-200/30'} absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl`} />
        <div className={`${isDarkTheme ? 'bg-emerald-600/10' : 'bg-emerald-200/30'} absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl`} />
      </div>

      <div className="relative p-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-lg ${isDarkTheme ? 'bg-white/10' : 'bg-white/60'}`}><span className="text-lg">💸</span></div>
          <h2 className={`text-xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{mode === 'edit' ? tt('income.editIncome', 'Edit Income') : tt('income.addNewIncome', 'Add New Income')}</h2>
          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{`You’re entering in ${targetCurrency}. We’ll save in THB using today’s rate.`}</p>
        </div>

        <div className="space-y-4">
          <div className="group">
            <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Icon</label>
            <div className="flex justify-center"><EmojiPickerPopup icon={income.icon} onSelect={(e)=>setField('icon', e)} isDark={isDarkTheme} /></div>
          </div>

          <div className="group">
            <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Income Source <span className="text-red-500">*</span></label>
            <input value={income.source} onChange={(e) => setField('source', e.target.value)} placeholder="e.g., Salary, Freelance…" type="text" className={fieldClass} required />
          </div>

          <div className="group">
            <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Category</label>
            <CategorySelect type="income" value={income.categoryId} isDark={isDarkTheme}
              onChange={(id, name) => { setField('categoryId', id); setField('categoryName', name || 'Uncategorized'); }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
                Amount ({targetCurrency}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-3 pointer-events-none ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="text-sm font-semibold">{symbol()}</span>
                </div>
                <input
                  value={income.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${fieldClass} pl-12`}
                  required
                />
              </div>
              {!!income.amount && (
                <div className={`mt-1 text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  Saved as ≈ {format(basePreview, 'THB')} (THB)
                </div>
              )}
            </div>

            <div className="group">
              <label className={`block text-xs font-semibold mb-2 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Date <span className="text-red-500">*</span></label>
              <input value={income.date} onChange={(e) => setField('date', e.target.value)} type="date" className={fieldClass} required />
            </div>
          </div>

          <div className="mt-6 pt-4">
            <button type="button" onClick={handleSubmit} disabled={!isFormValid}
              className={`group relative w-full overflow-hidden rounded-xl px-6 py-3 font-bold text-white transition-all duration-300 ${isFormValid ? (isDarkTheme ? 'bg-gradient-to-r from-green-600 to-indigo-600 hover:from-indigo-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' : 'bg-gradient-to-r from-green-500 to-indigo-500 hover:from-indigo-600 hover:to-green-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5') : 'bg-gray-400 cursor-not-allowed opacity-60'} focus:outline-none focus:ring-4 focus:ring-green-500/20`}>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <div className="relative flex items-center justify-center space-x-2">
                <span className="text-lg">✨</span>
                <span className="text-sm">{mode === 'edit' ? tt('income.updateIncome', 'Update Income') : tt('income.addIncome', 'Add Income')}</span>
                <span className="text-lg">💰</span>
              </div>
            </button>
          </div>

          {!isFormValid && <div className={`text-center text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{tt('income.fillRequired', 'Please fill in all required fields')}</div>}
        </div>
      </div>
    </div>
  );
};

export default AddIncomeForm;
