import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const NeonStatCard = ({ title, amount, subtitle, badgeText, colorTheme }) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';
  // colorTheme maps to specific neon styling
  const themes = {
    purple: {
      text: 'text-[#9b51e0]',
      gradient: 'from-[#9b51e0]/20 to-transparent',
      badgeBg: 'bg-[#9b51e0]/10',
      badgeTextFill: 'text-[#9b51e0]',
    },
    lime: {
      text: 'text-[#a3e635]',
      gradient: 'from-[#a3e635]/20 to-transparent',
      badgeBg: 'bg-[#a3e635]/10',
      badgeTextFill: 'text-[#a3e635]',
    },
    rose: {
      text: 'text-[#fb7185]',
      gradient: 'from-[#fb7185]/20 to-transparent',
      badgeBg: 'bg-[#fb7185]/10',
      badgeTextFill: 'text-[#fb7185]',
    }
  };

  const theme = themes[colorTheme] || themes.purple;
  const cardClass = isDark
    ? 'bg-[#13141C] border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
    : 'bg-[rgba(255,253,247,0.96)] border-black/8 shadow-[0_16px_40px_rgba(15,23,42,0.08)]';

  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-6 ${cardClass}`}>
      {/* Top right subtle glow */}
      <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-radial ${theme.gradient} blur-3xl rounded-full opacity-60 pointer-events-none`}></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h3 className={`mb-3 text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-gray-500' : 'text-[#6b7080]'}`}>
            {title}
          </h3>
          <div className={`text-4xl font-extrabold tracking-tighter ${theme.text} mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
            {amount}
          </div>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-600' : 'text-[#6b6f80]'}`}>
            {subtitle}
          </p>
        </div>

        {badgeText && (
          <div className="mt-8 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-1 ${theme.badgeBg} ${theme.badgeTextFill} text-[10px] font-bold tracking-wider rounded-md backdrop-blur-sm border border-current/10`}>
              {badgeText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeonStatCard;
