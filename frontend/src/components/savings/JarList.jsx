import { useEffect, useState, useContext } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { useCurrency } from '../../context/CurrencyContext';
import { toast } from 'react-hot-toast';
import { LuTrash2, LuWallet, LuArrowDown, LuArrowUp } from 'react-icons/lu';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';

export default function JarList() {
  const { prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const { t } = useT();

  const [jars, setJars] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inputByJar, setInputByJar] = useState({});
  const { format } = useCurrency();

  const load = async () => {
    const { data } = await axiosInstance.get(API_PATHS.JARS.BASE);
    setJars(Array.isArray(data) ? data : []);
  };

  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  useEffect(() => { load(); }, []);

  const onChangeAmt = (id, v) => setInputByJar(prev => ({ ...prev, [id]: v }));

  const createJar = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setCreating(true);
      await axiosInstance.post(API_PATHS.JARS.BASE, { name: name.trim() });
      setName('');
      toast.success('Jar created');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to create jar');
    } finally {
      setCreating(false);
    }
  };

  const fund = async (id) => {
    const amt = Number(inputByJar[id] || 0);
    if (!amt || amt <= 0) return;
    try {
      await axiosInstance.post(API_PATHS.JARS.FUND(id), { amount: amt });
      onChangeAmt(id, '');
      toast.success(`Funded THB ${amt.toLocaleString()}`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Fund failed');
    }
  };

  const withdraw = async (id) => {
    const amt = Number(inputByJar[id] || 0);
    if (!amt || amt <= 0) return;
    try {
      await axiosInstance.post(API_PATHS.JARS.WITHDRAW(id), { amount: amt });
      onChangeAmt(id, '');
      toast.success(`Withdrew THB ${amt.toLocaleString()}`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Withdraw failed');
    }
  };

  const removeJar = async (id, balance) => {
    if (balance > 0) {
      toast.error('You can only delete an empty jar. Withdraw to 0 first.');
      return;
    }
    if (!confirm('Delete this jar? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`${API_PATHS.JARS.BASE}/${id}`);
      toast.success('Jar deleted');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Delete failed');
    }
  };

  // Common class helpers
  const cardClass = `rounded-2xl border p-4 shadow-sm hover:shadow-md transition ring-1 ring-transparent hover:ring-violet-200 ${
    isDark ? 'bg-gray-900 border-gray-700 hover:ring-violet-800' : 'bg-white/90 border-gray-200'
  }`;

  const inputClass = `mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
    isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
  }`;

  const btnClass = (bg, hoverBg, text='white') => `px-3 py-2 rounded-xl ${bg} ${text} hover:${hoverBg} flex items-center gap-1`;

  return (
    <div className="space-y-6">
      {/* Create Jar */}
      <form onSubmit={createJar} className={`rounded-2xl border p-4 shadow-sm backdrop-blur ${isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-300'}`}>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.newJarName','New Jar Name')}</label>
            <input
              className={`${inputClass} placeholder:text-gray-400`}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Emergency Fund"
            />
          </div>
          <button
            className={`px-4 py-2 rounded-xl bg-violet-600 text-white shadow hover:bg-violet-700 disabled:opacity-60`}
            disabled={creating || !name.trim()}
          >
            {tt('saving.addJar',`{creating ? 'Adding…' : 'Add Jar'}`)}
          </button>
        </div>
      </form>

      {/* Jar cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {jars.map(j => {
          const amt = inputByJar[j._id] ?? '';
          const balance = Number(j.balance || 0);
          return (
            <div key={j._id} className={cardClass}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-700'}`}><LuWallet /></div>
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{j.name}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tt('saving.jar','Jar')}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeJar(j._id, balance)}
                  className={`p-2 rounded-lg ${
                    balance > 0
                      ? `${isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
                      : `${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`
                  }`}
                  title={balance > 0 ? 'Withdraw to 0 before delete' : 'Delete jar'}
                >
                  <LuTrash2 />
                </button>
              </div>

              <div className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tt('saving.balance','Balance')}</div>
              <div className={`text-xl font-semibold ${isDark ? 'text-white' : ''}`}>{format(balance)}</div>

              <div className="mt-4 flex gap-2 items-end">
                <div className="flex-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{tt('saving.amount','Amount (THB)')}</label>
                  <input
                    className={inputClass}
                    value={amt}
                    onChange={e => onChangeAmt(j._id, e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
                <button onClick={() => fund(j._id)} className={btnClass('bg-green-600','bg-green-700') } title="Move from free cash → jar">
                  <LuArrowUp /> {tt('saving.fund','Fund')}
                </button>
                <button onClick={() => withdraw(j._id)} className={btnClass('bg-amber-600','bg-amber-700')} title="Move from jar → free cash">
                  <LuArrowDown /> {tt('saving.withdraw','Withdraw')}
                </button>
              </div>
            </div>
          );
        })}
        {jars.length === 0 && <div className={`col-span-full text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No jars yet. Create one above.</div>}
      </div>
    </div>
  );
}
