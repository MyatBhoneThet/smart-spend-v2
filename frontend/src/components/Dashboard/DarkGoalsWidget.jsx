import React, { useContext } from 'react';
import { LuTarget } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';

const DarkGoalsWidget = ({ goals, totalGoals }) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  const defaultGoals = Array.isArray(goals) ? goals : [];

  const getProgressColor = (progress) => {
    if (progress < 10) return 'from-gray-500 to-gray-400';
    if (progress < 50) return 'from-[#fb7185] to-[#f43f5e]';
    if (progress < 70) return 'from-[#eab308] to-[#facc15]';
    return 'from-[#84cc16] to-[#a3e635]';
  };

  const getTextColor = (progress) => {
    if (progress < 10) return 'text-gray-400';
    if (progress < 50) return 'text-[#fb7185]';
    if (progress < 70) return 'text-[#facc15]';
    return 'text-[#a3e635]';
  };

  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-white/18 border-white/22 shadow-[0_16px_40px_rgba(15,23,42,0.12)] ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150';

  const { t } = useT();
  const tt = (k, f) => { const v = t?.(k); return v && v !== k ? v : f; };

  return (
    <div className={`h-[260px] w-full overflow-hidden rounded-[22px] border p-5 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[12px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>{tt('dashboard.goals', 'Goals')}</h3>
        <span className="px-2 py-0.5 bg-[#162d1a] text-[#a3e635] text-[10px] font-bold tracking-widest uppercase rounded">
          {(typeof totalGoals === 'number' ? totalGoals : defaultGoals.length)} {tt('dashboard.active', 'active')}
        </span>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-center">
        {defaultGoals.length > 0 ? (
          defaultGoals.map((g, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {g.icon || <LuTarget className="text-[#eab308]" />}
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-[#11131b]'}`}>{g.name}</span>
                </div>
                <span className={`text-xs font-black tracking-widest ${getTextColor(g.progress)}`}>
                  {g.progress}%
                </span>
              </div>
              
              <div className={`relative h-1.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-[#1e1e24]' : 'bg-black/[0.08]'}`}>
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${getProgressColor(g.progress)} shadow-[0_0_10px_currentColor]`}
                  style={{ width: `${g.progress}%` }}
                ></div>
              </div>
            </div>
          ))
        ) : (
          <div className={`flex h-full items-center justify-center text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
            {tt('dashboard.noGoals', 'No active goals')}
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkGoalsWidget;
