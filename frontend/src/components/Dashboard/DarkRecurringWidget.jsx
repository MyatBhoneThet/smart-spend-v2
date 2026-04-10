import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';

const DarkRecurringWidget = ({ recurring, totalAmount, format }) => {
  const { prefs } = useContext(UserContext) || {};
  const { format: formatCurrency } = useCurrency();
  const isDark = prefs?.theme === 'dark';
  const defaultRecurring = Array.isArray(recurring) ? recurring : [];
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-white/18 border-white/22 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150';

  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };
  const resolvedFormat = (amount) => {
    if (typeof format === 'function') return format(Number(amount || 0));
    if (typeof formatCurrency === 'function') return formatCurrency(Number(amount || 0));
    return Number(amount || 0).toLocaleString();
  };

  return (
    <div className={`h-[260px] w-full overflow-hidden rounded-[22px] border p-5 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[12px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>{tt('menu.recurring', 'Recurring')}</h3>
        <span className="text-[10px] font-bold tracking-widest text-[#fb7185] uppercase">
          {resolvedFormat(totalAmount)} {tt('dashboard.perMonth', '/ mo')}
        </span>
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-center">
        {defaultRecurring.length > 0 ? (
          defaultRecurring.map((r, idx) => (
          <div key={idx} className={`-mx-1 flex items-center justify-between rounded p-1 transition-colors group cursor-pointer ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.03]'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: r.color, color: r.color }}></div>
              <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#11131b]'}`}>{r.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-[#6b7080]'}`}>{r.repeat || tt('recurring.monthly', 'monthly')}</span>
              <span className="text-xs font-bold font-mono tracking-tight text-[#fb7185]">
                -{resolvedFormat(r.amount)}
              </span>
            </div>
            </div>
          ))
        ) : (
          <div className={`flex h-full items-center justify-center text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
            {tt('recurring.noRules', 'No active recurring rules')}
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkRecurringWidget;
