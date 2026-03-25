import React, { useContext } from 'react';
import { LuTarget } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';

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
    : 'bg-[rgba(255,253,247,0.96)] border-black/8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]';

  return (
    <div className={`h-[300px] w-full overflow-hidden rounded-[24px] border p-6 flex flex-col relative ${cardClass}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-[13px] font-black uppercase tracking-[0.1em] ${isDark ? 'text-gray-100' : 'text-[#11131b]'}`}>Goals</h3>
        <span className="px-2 py-0.5 bg-[#162d1a] text-[#a3e635] text-[10px] font-bold tracking-widest uppercase rounded">
          {(typeof totalGoals === 'number' ? totalGoals : defaultGoals.length)} active
        </span>
      </div>

      <div className="flex flex-col gap-5 flex-1 justify-center">
        {defaultGoals.length > 0 ? (
          defaultGoals.map((g, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {g.icon || <LuTarget className="text-[#eab308]" />}
                  <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-[#11131b]'}`}>{g.name}</span>
                </div>
                <span className={`text-sm font-black tracking-widest ${getTextColor(g.progress)}`}>
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
            No active goals
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkGoalsWidget;
