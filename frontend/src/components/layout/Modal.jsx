import React, { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const ACCENT_STYLES = {
  income: {
    dark: 'border-white/10 bg-white/[0.05] text-white ring-1 ring-white/[0.08]',
    light: 'border-white/18 bg-white/14 text-slate-900 ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150',
    glowDark:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%,rgba(217,255,52,0.08)_70%,transparent)]',
    glowLight:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_36%,rgba(163,230,53,0.12)_72%,transparent)]',
  },
  expense: {
    dark: 'border-white/10 bg-white/[0.05] text-white ring-1 ring-white/[0.08]',
    light: 'border-white/18 bg-white/14 text-slate-900 ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150',
    glowDark:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%,rgba(255,182,193,0.09)_70%,transparent)]',
    glowLight:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_36%,rgba(251,113,133,0.12)_72%,transparent)]',
  },
  neutral: {
    dark: 'border-white/10 bg-white/[0.06] text-white ring-1 ring-white/[0.08]',
    light: 'border-white/18 bg-white/14 text-slate-900 ring-1 ring-white/30 backdrop-blur-3xl backdrop-saturate-150',
    glowDark:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%,rgba(148,163,184,0.08)_70%,transparent)]',
    glowLight:
      'bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_36%,rgba(148,163,184,0.1)_72%,transparent)]',
  },
};

const Modal = ({ isOpen, onClose, title, children, accent = 'neutral' }) => {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const accentStyles = ACCENT_STYLES[accent] || ACCENT_STYLES.neutral;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 right-0 left-0 z-[9999] flex h-[calc(100%-1rem)] w-full max-h-full items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60">
      <div className="relative w-full max-w-2xl max-h-full p-4">
        <div
          className={`relative overflow-hidden rounded-2xl border shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${
            isDark ? accentStyles.dark : accentStyles.light
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 ${
              isDark ? accentStyles.glowDark : accentStyles.glowLight
            }`}
          />
          <div className={`relative flex items-center justify-between border-b px-5 py-4 md:px-6 md:py-5 ${
            isDark ? 'border-white/10' : 'border-white/50'
          }`}>
            <h3 className={`text-lg font-semibold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </h3>
            <button
              type="button"
              className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
                isDark
                  ? 'border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  : 'border-slate-200/80 text-slate-500 hover:bg-white/80 hover:text-slate-900'
              }`}
              onClick={onClose}
            >
              <svg
                className="h-3 w-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
            </button>
          </div>
          <div className={`relative p-5 md:p-6 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
