import { useEffect, useMemo, useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useCurrency } from '../../context/CurrencyContext';
import { toast } from 'react-hot-toast';
import { LuTarget, LuTrash2, LuCalendarClock, LuPiggyBank, LuPlus } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';

export default function GoalList() {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();
  const [goals, setGoals] = useState([]);
  const [jars, setJars] = useState([]);

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [jarId, setJarId] = useState('');
  const [aaEnabled, setAaEnabled] = useState(false);
  const [aaType, setAaType] = useState('percent');
  const [aaValue, setAaValue] = useState('10');

  const { format } = useCurrency();

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const jarMap = useMemo(() => {
    const m = {};
    for (const j of jars) m[j._id] = j;
    return m;
  }, [jars]);

  const load = async () => {
    try {
      const [{ data: gs }, { data: js }] = await Promise.all([
        axiosInstance.get(API_PATHS.GOALS.BASE),
        axiosInstance.get(API_PATHS.JARS.BASE),
      ]);
      setGoals(Array.isArray(gs) ? gs : []);
      setJars(Array.isArray(js) ? js : []);
      if (!jarId && js[0]) setJarId(js[0]._id);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to load goals/jars');
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetAmount || !targetDate || !jarId) return;
    try {
      await axiosInstance.post(API_PATHS.GOALS.BASE, {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        targetDate,
        jarId,
        autoAllocate: { enabled: aaEnabled, type: aaType, value: Number(aaValue) },
      });
      setTitle(''); setTargetAmount(''); setTargetDate('');
      toast.success('Goal created');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create goal');
    }
  };

  const fund = async (id, amt) => {
    const n = Number(amt || 0);
    if (!n || n <= 0) return;
    try {
      const { data } = await axiosInstance.post(API_PATHS.GOALS.FUND(id), { amount: n });
      toast.success(data?.message || `Funded THB ${n.toLocaleString()}`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Fund failed');
    }
  };

  const autoAlloc = async (amt) => {
    const n = Number(amt || 0);
    if (!n || n <= 0) return;
    try {
      const { data } = await axiosInstance.post(API_PATHS.GOALS.AUTO_ALLOCATE, { amount: n });
      toast.success('Auto-allocated');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Auto-allocate failed');
    }
  };

  const removeGoal = async (id) => {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`${API_PATHS.GOALS.BASE}/${id}`);
      toast.success('Goal deleted');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  // Common class helpers
  const cardClass = `rounded-2xl border p-4 shadow-sm hover:shadow-md transition ring-1 ring-transparent hover:ring-violet-200 ${
    isDark ? 'bg-gray-900 border-gray-800 hover:ring-violet-800' : 'bg-white border-gray-200'
  }`;

  const inputClass = `mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const btnClass = (bg, hoverBg, text='white') => `px-3 py-2 rounded-xl ${bg} ${text} hover:${hoverBg}`;

  return (
    <div className="space-y-6">
      {/* Create Goal */}
      <form onSubmit={create} className={`rounded-2xl border p-4 shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.title','Goal title')}</label>
            <input className={`${inputClass} placeholder-gray-400`} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Buy MacBook" />
          </div>
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.amount','Target amount (THB)')}</label>
            <input className={`${inputClass} placeholder-gray-400`} value={targetAmount} onChange={e=>setTargetAmount(e.target.value)} placeholder="35000" />
          </div>
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.date','Target date')}</label>
            <input className={inputClass} type="date" value={targetDate} onChange={e=>setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.jar','Jar')}</label>
            <select className={inputClass} value={jarId} onChange={e=>setJarId(e.target.value)}>
              {jars.map(j => <option key={j._id} value={j._id}>{j.name}</option>)}
            </select>
          </div>

          <div className={`md:col-span-2 p-3 flex flex-wrap items-center gap-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={aaEnabled} onChange={e=>setAaEnabled(e.target.checked)} />
              <span className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>{tt('saving.autoAllocate','Enable auto-allocate on income')}</span>
            </label>
            <select className={`border rounded-lg px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}`} value={aaType} onChange={e=>setAaType(e.target.value)}>
              <option value="percent">{tt('saving.percent','Percent')}</option>
              <option value="fixed">{tt('saving.fixed','Fixed')}</option>
            </select>
            <input className={`border rounded-lg px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}`} value={aaValue} onChange={e=>setAaValue(e.target.value)} placeholder={aaType === 'percent' ? '10 (%)' : '1000 (THB)'} />
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {tt('saving.goalText2','Auto-allocation moves a portion of each income into this goal’s jar.')}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 rounded-xl bg-violet-600 text-white shadow hover:bg-violet-700 flex items-center gap-2">
            <LuPlus /> {tt('saving.createGoal','Create goal')}
          </button>
        </div>
      </form>

      {/* Goal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map(g => {
          const saved = Number(g.currentAmount || 0);
          const target = Math.max(1, Number(g.targetAmount || 0));
          const pct = Math.min(100, Math.round((saved / target) * 100));
          const jar = jarMap[g.jarId];

          return (
            <div key={g._id} className={cardClass}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>
                    <LuTarget />
                  </div>
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-gray-100' : ''}`}>{g.title}</div>
                    <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="inline-flex items-center gap-1"><LuPiggyBank /> {jar?.name || 'Jar'}</span>
                      <span className="inline-flex items-center gap-1"><LuCalendarClock /> {new Date(g.targetDate).toLocaleDateString()}</span>
                      {g.status === 'achieved' && (
                        <span className={`ml-2 px-2 py-0.5 rounded text-[11px] ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          {tt('saving.achieved','Achieved')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeGoal(g._id)}
                  className={`p-2 rounded-lg ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  title="Delete goal"
                >
                  <LuTrash2 />
                </button>
              </div>

              <div className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tt('saving.progress','Progress')}</div>
              <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : ''}`}>
                {format(saved)} <span className={`text-gray-500 ${isDark ? 'text-gray-400' : ''}`}>of</span> {format(target)} • {pct}%
              </div>
              <div className="mt-2 h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <div className="h-2 bg-gradient-to-r from-violet-600 to-indigo-600" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => fund(g._id, 500)} className={btnClass('bg-green-600','bg-green-700')}>{tt('saving.fund500','Fund ฿500')}</button>
                <button onClick={() => autoAlloc(2000)} className={btnClass('bg-indigo-600','bg-indigo-700')} title="Simulate income allocation (e.g., 10% of ฿2000 → jar)">
                  {tt('saving.testAutoAllocate','Test Auto-Allocate (฿2000)')}
                </button>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className={`col-span-full text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {tt('saving.noGoal','No goals yet. Create one above.')}
          </div>
        )}
      </div>
    </div>
  );
}
