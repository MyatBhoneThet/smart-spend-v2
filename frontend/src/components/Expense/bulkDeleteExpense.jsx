import React, { useState } from 'react';
import useT from "../../hooks/useT";

const PERIOD_OPTIONS = [
  { key: 'expense.lastMonth', fallback: 'Last Month', value: 'last-month', helper: 'Delete entries from the previous calendar month.' },
  { key: 'expense.last6Month', fallback: 'Last 6 Months', value: 'last-6-months', helper: 'Delete entries from the last six months.' },
  { key: 'expense.lastYear', fallback: 'Last Year', value: 'last-year', helper: 'Delete entries from the previous calendar year.' },
  { key: 'expense.allExpenses', fallback: 'All Expenses', value: 'all', helper: 'Remove every expense entry.' },
];

const BulkDeleteExpense = ({
  isOpen,
  onClose,
  onConfirm,
  isDarkTheme,
  variant = 'default',
}) => {
  const [bulkDeletePeriod, setBulkDeletePeriod] = useState('all');
  const { t } = useT();

  if (!isOpen) return null;

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const handleConfirm = () => {
    onConfirm(bulkDeletePeriod);
  };

  const isNeon = variant === 'neon';
  const rootClass = isNeon
    ? 'space-y-6 rounded-[24px] border border-white/10 bg-[#11131b] p-6 text-white'
    : `space-y-6 p-6 rounded-xl transition-all duration-300 ${
        isDarkTheme
          ? 'bg-gray-800 border border-gray-700 text-gray-200'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900'
      }`;

  return (
    <div className={rootClass}>
      <div className={isNeon ? 'rounded-2xl border border-[#fb7185]/20 bg-[#25141a] p-4' : 'rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-lg'}>
        <h3 className={`text-sm font-bold ${isNeon ? 'text-[#fb7185]' : 'text-white'}`}>
          {tt('expense.warning', 'Warning')}
        </h3>
        <p className={`mt-1 text-sm ${isNeon ? 'text-[#d0d3e4]' : 'text-white/95'}`}>
          {tt('expense.warningText', 'This action cannot be undone. Deleted expenses will be permanently removed.')}
        </p>
      </div>

      <div>
        <p className="text-lg font-bold">{tt('expense.selectDeletionPeriod', 'Select deletion period:')}</p>
        <p className={`mt-1 text-sm ${isNeon ? 'text-[#7b8095]' : ''}`}>
          Choose the exact range to remove.
        </p>
      </div>

      <div className="space-y-3">
        {PERIOD_OPTIONS.map((item) => (
          <label
            key={item.value}
            className={`flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition-colors ${
              bulkDeletePeriod === item.value
                ? isNeon
                  ? 'border border-[#ff6b81]/20 bg-[#ff6b81]/10'
                  : 'border border-gray-600 bg-gray-700'
                : isNeon
                ? 'border border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                : isDarkTheme
                ? 'border border-gray-600 bg-gray-700 hover:bg-gray-600'
                : 'border-2 border-slate-200 bg-white hover:shadow-lg'
            }`}
          >
            <input
              type="radio"
              name="period"
              value={item.value}
              checked={bulkDeletePeriod === item.value}
              onChange={(e) => setBulkDeletePeriod(e.target.value)}
              className="mt-1 h-4 w-4 accent-rose-400"
            />

            <div className="flex-1">
              <div className={`font-bold ${bulkDeletePeriod === item.value && !isNeon ? 'text-white' : ''}`}>
                {tt(item.key, item.fallback)}
              </div>
              <div className={`mt-1 text-sm ${isNeon ? 'text-[#7b8095]' : 'opacity-80'}`}>
                {item.helper}
              </div>
            </div>

            {bulkDeletePeriod === item.value && (
              <span className={isNeon ? 'text-sm font-bold text-[#ff6b81]' : 'text-white'}>
                {isNeon ? 'Selected' : '✓'}
              </span>
            )}
          </label>
        ))}
      </div>

      <div className={`flex justify-end gap-3 pt-4 ${isNeon ? 'border-t border-white/10' : 'border-t border-gray-300 dark:border-gray-600'}`}>
        <button
          onClick={onClose}
          className={isNeon ? 'rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-[#d0d3e4] hover:bg-white/[0.05]' : `px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            isDarkTheme
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-slate-600 hover:bg-slate-700 text-white'
          }`}
        >
          {tt('expense.cancel', 'Cancel')}
        </button>
        <button
          onClick={handleConfirm}
          className={isNeon ? 'rounded-2xl bg-[#ff6b81] px-4 py-2 text-sm font-bold text-white hover:bg-[#ff5871]' : `px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            isDarkTheme
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
          }`}
        >
          {tt('expense.deleteSelected', 'Delete Selected')}
        </button>
      </div>
    </div>
  );
};

export default BulkDeleteExpense;
