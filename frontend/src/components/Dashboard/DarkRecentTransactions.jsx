import React, { useContext } from 'react';
import { LuShoppingCart, LuCoffee, LuMusic, LuCloud, LuWallet } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import useT from '../../hooks/useT';

const getIconForCategory = (category, type) => {
  if (type === 'income') return <LuWallet className="text-[#a3e635]" />;
  const cat = category?.toLowerCase() || '';
  if (cat.includes('food') || cat.includes('dining')) return <LuCoffee className="text-[#fb7185]" />;
  if (cat.includes('sub') || cat.includes('music')) return <LuMusic className="text-[#9b51e0]" />;
  if (cat.includes('cloud')) return <LuCloud className="text-[#38bdf8]" />;
  return <LuShoppingCart className="text-gray-400" />;
};

const DarkRecentTransactions = ({
  transactions,
  onSeeAll,
  formatAmount = (amount, type) =>
    `${type === 'income' ? '+' : '-'}$${Math.abs(Number(amount || 0)).toFixed(2)}`,
}) => {
  const { prefs } = useContext(UserContext) || {};
  const { format } = useCurrency();
  const isDark = prefs?.theme === 'dark';
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-white/18 border-white/22 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150';

  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };
  const resolvedFormatAmount = (amount, type) => {
    const value = Number(amount || 0);
    const formatted = typeof format === 'function' ? format(Math.abs(value)) : Math.abs(value).toLocaleString();
    return `${type === 'income' ? '+' : '-'}${formatted}`;
  };

  return (
    <div className={`h-[340px] w-full overflow-hidden rounded-[22px] border p-5 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[12px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>{tt('dashboard.recent', 'Recent')}</h3>
        <button onClick={onSeeAll} className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${isDark ? 'bg-[#251e38] text-[#9b51e0] hover:bg-[#32284b]' : 'bg-[#f2e9ff] text-[#7e3af2] hover:bg-[#eadbff]'}`}>
          {tt('dashboard.viewAll', 'View all →')}
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto scrollbar-none pb-2 h-full">
        {transactions?.length > 0 ? (
          transactions.map((t, idx) => (
            <div key={idx} className={`-mx-2 flex items-center justify-between rounded-xl p-1.5 transition-colors group cursor-pointer ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.03]'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${isDark ? 'border-white/5 bg-[#1e1e24] group-hover:bg-[#25252d]' : 'border-black/6 bg-[rgba(17,19,27,0.04)] group-hover:bg-[rgba(17,19,27,0.08)]'}`}>
                  {getIconForCategory(t.category, t.type)}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#11131b]'}`}>{t.source || t.category || tt('dashboard.transactionFallback', 'Transaction')}</span>
                  <span className={`mt-0.5 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>{t.category || tt('dashboard.generalCategory', 'GENERAL')}</span>
                </div>
              </div>
              <div className={`text-xs font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-[#a3e635]' : 'text-[#fb7185]'}`}>
                {formatAmount(t.amount, t.type) || resolvedFormatAmount(t.amount, t.type)}
              </div>
            </div>
          ))
        ) : (
          <div className={`flex h-full flex-col items-center justify-center ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
            <LuWallet size={32} className="mb-2 opacity-50" />
            <p className="text-[11px] font-bold uppercase tracking-widest">{tt('dashboard.noTransactions', 'No recent transactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkRecentTransactions;
