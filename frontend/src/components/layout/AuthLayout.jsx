import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const AuthLayout = ({ children }) => {
  const { prefs } = useContext(UserContext) || {};
  const isDark = prefs?.theme === 'dark';

  return (
    <div className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-[#05070b] text-white' : 'bg-[#fdf7f7] text-[#11131b]'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="auth-ambient" />
          <div className="auth-ambient-secondary" />
          <div className="auth-noise" />
          <div className={`absolute -left-24 top-12 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-[#d9ff34]/12' : 'bg-[#a3e635]/20'}`} />
          <div className={`absolute right-0 top-1/3 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-[#47d7ff]/10' : 'bg-[#fb7185]/10'}`} />
          <div className={`absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-white/[0.05]' : 'bg-white/50'}`} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[980px] items-center justify-center px-4 py-10 sm:px-8 lg:px-12">

        <div className="relative w-full max-w-xl">
          <div className={`mb-8 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-2xl ${
            isDark ? 'border-white/10 bg-white/[0.05] text-white' : 'border-white/45 bg-white/58 text-[#11131b] backdrop-blur-3xl'
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isDark ? 'bg-[#d9ff34]' : 'bg-[#84cc16]'}`} />
            SmartSpend
          </div>
          <div className={`glass-panel p-8 sm:p-10 ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
