import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const DarkRecurringWidget = ({ recurring, totalAmount, format }) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const defaultRecurring = Array.isArray(recurring) ? recurring : [];
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-[rgba(255,253,247,0.96)] border-black/8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]';

  return (
    <div className={`h-[300px] w-full overflow-hidden rounded-[24px] border p-6 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-[13px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>Recurring</h3>
        <span className="text-[10px] font-bold tracking-widest text-[#fb7185] uppercase">
          {(typeof format === 'function' ? format(Number(totalAmount || 0)) : `$${Number(totalAmount || 0).toFixed(2)}`)} / mo
        </span>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-center">
        {defaultRecurring.length > 0 ? (
          defaultRecurring.map((r, idx) => (
            <div key={idx} className={`-mx-1 flex items-center justify-between rounded p-1 transition-colors group cursor-pointer ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.03]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: r.color, color: r.color }}></div>
                <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-[#11131b]'}`}>{r.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-[#6b7080]'}`}>{r.repeat || 'monthly'}</span>
                <span className="text-sm font-bold font-mono tracking-tight text-[#fb7185]">
                  -${Number(r.amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className={`flex h-full items-center justify-center text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
            No active recurring rules
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkRecurringWidget;
