import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import { useCurrency } from '../../context/CurrencyContext';

export default function SavingsQuickCard() {
  const [stats, setStats] = useState({ jars: 0, goals: 0, total: 0 });
  const { prefs } = useContext(UserContext);
  const { format } = useCurrency(); // use currency formatting
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();

  const tt = (key, fallback) => {
    const s = t(key);
    return s && s !== key ? s : fallback;
  };

  useEffect(() => {
    (async () => {
      const [j, g] = await Promise.all([
        axiosInstance.get(API_PATHS.JARS.BASE),
        axiosInstance.get(API_PATHS.GOALS.BASE),
      ]);
      const total = (j.data || []).reduce((s, x) => s + Number(x.balance || 0), 0);
      setStats({ jars: j.data?.length || 0, goals: g.data?.length || 0, total });
    })();
  }, []);

  return (
    <div className="glass-panel p-6">
      {/* Header */}
      <div className="font-semibold text-lg tracking-wide mb-1">{tt("dashboard.savings", "Savings")}</div>
      <div className={`text-sm font-medium mb-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {tt("dashboard.jarsGoalsOverview", "Jars & Goals overview")}
      </div>

      {/* Stats */}
      <div className={`flex gap-6 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
        <div className="bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          {tt("dashboard.jars", "Jars")}: <b className="ml-1 text-slate-900 dark:text-white">{stats.jars}</b>
        </div>
        <div className="bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          {tt("dashboard.goals", "Goals")}: <b className="ml-1 text-slate-900 dark:text-white">{stats.goals}</b>
        </div>
        <div className="bg-green-50/50 dark:bg-green-900/10 px-4 py-2 rounded-lg border border-green-200/50 dark:border-green-800/50 ml-auto">
          {tt("dashboard.totalReserved", "Total reserved")}:
          <b className="text-green-600 dark:text-green-400 ml-1"> {format(stats.total)}</b>
        </div>
      </div>

      {/* Link */}
      <Link
        to="/savings"
        className="btn-primary inline-block text-center mt-6 w-auto px-6 font-semibold"
      >
        {tt("dashboard.openSavings", "Open Savings")}
      </Link>
    </div>
  );
}
