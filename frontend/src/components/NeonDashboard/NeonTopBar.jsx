import React, { useContext } from 'react';
import { LuPlus } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';

const NeonTopBar = ({
  userName,
  onAddTransaction,
  title = 'DASHBOARD',
  subtitle,
  liveLabel = 'Live',
  periodLabel = 'Mar 2026',
  actionLabel = 'Add Transaction',
  periods = ['W', 'M', 'Q', 'Y'],
  selectedPeriod = 'M',
  onPeriodChange,
}) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const resolvedSubtitle = subtitle || `Welcome back, ${userName || 'User'}`;
  const showLiveMeta = Boolean(liveLabel || periodLabel);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1
            className={`text-3xl font-black tracking-[0.2em] uppercase ${isDark ? 'text-white' : 'text-[#11131b]'}`}
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            {title}
          </h1>
          {showLiveMeta && (
            <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-[#5f6477]'}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84cc16]"></span>
              </span>
              <span>{[liveLabel, periodLabel].filter(Boolean).join(' • ')}</span>
            </div>
          )}
        </div>
        <p className={`mt-1 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-[#6c7086]'}`}>
          {resolvedSubtitle}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-6 md:mt-0">
        <div
          className={`flex rounded-lg p-1 backdrop-blur-md ${
            isDark
              ? 'border border-white/5 bg-[#13141C]'
              : 'border border-black/8 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
          }`}
        >
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onPeriodChange?.(period)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                period === selectedPeriod
                  ? isDark
                    ? 'bg-[#1e1f26] text-white shadow-sm'
                    : 'bg-[#11131b] text-[#d9ff34] shadow-sm'
                  : isDark
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    : 'text-[#666c80] hover:bg-black/[0.04] hover:text-[#11131b]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <button
          onClick={onAddTransaction}
          className="flex items-center gap-2 bg-[#a3e635] text-black px-5 py-2 rounded-lg font-bold text-sm tracking-wide hover:bg-[#bef264] transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:shadow-[0_0_20px_rgba(163,230,53,0.5)] active:scale-95"
        >
          <LuPlus className="text-lg font-black" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default NeonTopBar;
