import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const InfoCard = ({ icon, label, value, color }) => {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';

  return (
    <div className="glass-panel flex gap-6 p-6 group animate-scale-in" style={{ animationDuration: '0.4s' }}>
      <div
        className={`
          w-16 h-16 rounded-2xl flex items-center justify-center
          text-white text-[28px] drop-shadow-md shadow-lg
          ${color}
          ${isDark ? 'opacity-90' : ''}
          transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
        `}
      >
        {icon}
      </div>

      <div className="flex flex-col justify-center">
        <h6 className={`text-sm font-semibold tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {label}
        </h6>

        <span className={`text-[26px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </span>
      </div>
    </div>
  );
};

export default InfoCard;
