import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { clearStoredToken } from '../../utils/authSession';

const uiWeekToServer = (v) => (String(v).toLowerCase().startsWith('mon') ? 'monday' : 'sunday');
const serverWeekToUI = (v) => (String(v).toLowerCase().startsWith('mon') ? 'Mon' : 'Sun');
const normalizeCurrency = (v) => (String(v || 'THB').match(/[A-Za-z]{3}/)?.[0] || 'THB').toUpperCase();
const normalizeLanguage = (v) => {
  const s = String(v || 'en').toLowerCase();
  const map = { english: 'en', en: 'en', thai: 'th', th: 'th', burmese: 'my', myanmar: 'my', my: 'my' };
  return map[s] || (s.length > 2 ? s.slice(0, 2) : s);
};

const DEFAULTS = { currency: 'THB', theme: 'light', weekStartsOn: 'Mon', language: 'en' };

export default function Settings() {
  const { t } = useT();
  const { prefs, updatePrefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const navigate = useNavigate();
  const { rates, lastUpdated, loading, refreshRates } = useCurrency();

  const [settings, setSettings] = useState(DEFAULTS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tt = (k, f) => {
    const s = t(k);
    return s && s !== k ? s : f;
  };

  useEffect(() => {
    if (!prefs) return;
    setSettings((s) => ({
      ...s,
      theme: prefs.theme || s.theme,
      language: normalizeLanguage(prefs.language || s.language),
      currency: normalizeCurrency(prefs.currency || s.currency),
      weekStartsOn: serverWeekToUI(prefs.weekStartsOn || s.weekStartsOn),
    }));
  }, [prefs]);

  const update = (k, v) => setSettings((prev) => ({ ...prev, [k]: v }));

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);
      const payload = {
        theme: settings.theme,
        currency: normalizeCurrency(settings.currency),
        language: normalizeLanguage(settings.language),
        weekStartsOn: uiWeekToServer(settings.weekStartsOn),
      };
      updatePrefs(settings);
      await axiosInstance.put(API_PATHS.USER.UPDATE_PREFS, payload);
      toast.success(tt('settings.saved', 'Preferences saved'));
    } catch (err) {
      console.error(err?.response?.data || err);
      toast.error(err?.response?.data?.message || tt('settings.saveError', 'Could not save preferences'));
    } finally {
      setSavingPrefs(false);
    }
  };

  const resetPreferences = () => {
    setSettings(DEFAULTS);
    updatePrefs(DEFAULTS);
    toast.success(tt('settings.resetSuccess', 'Restored defaults'));
  };

  const handleChangePassword = async () => {
    if (!newPwd || !confirmPwd) return toast.error(tt('settings.password.enterBoth', 'Please enter a new password and confirm it.'));
    if (newPwd.length < 8) return toast.error(tt('settings.password.tooShort', 'New password must be at least 8 characters.'));
    if (newPwd !== confirmPwd) return toast.error(tt('settings.password.noMatch', 'New passwords do not match.'));
    try {
      setChangingPwd(true);
      await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, { currentPassword: currPwd, newPassword: newPwd });
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('');
      toast.success(tt('settings.password.updated', 'Password updated. Please log in again.'));
      clearStoredToken();
      navigate('/login');
    } catch (err) {
      console.error(err?.response?.data || err);
      toast.error(err?.response?.data?.message || tt('settings.password.error', 'Could not change password'));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return toast.error(tt('settings.deleteConfirmError', 'Type DELETE to confirm'));
    try {
      setDeleting(true);
      await axiosInstance.delete(API_PATHS.USER.DELETE_ME);
      toast.success(tt('settings.deleted', 'Account deleted'));
      clearStoredToken();
      navigate('/login');
    } catch (err) {
      console.error(err?.response?.data || err);
      toast.error(err?.response?.data?.message || tt('settings.deleteError', 'Could not delete account'));
    } finally {
      setDeleting(false);
    }
  };

  const last = lastUpdated ? new Date(lastUpdated).toLocaleString() : '—';
  const pageClass = isDark
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.11),transparent_26%),radial-gradient(circle_at_top_right,rgba(71,215,255,0.08),transparent_22%),linear-gradient(180deg,#090b11_0%,#05070b_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(217,255,52,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.72),transparent_20%),linear-gradient(180deg,#fefbf8_0%,#f7f3ea_100%)] text-[#11131b]';
  const cardClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 bg-white/28 text-[#11131b] shadow-[0_24px_90px_rgba(15,23,42,0.08)] ring-1 ring-white/45 backdrop-blur-3xl';
  const sectionDivider = isDark ? 'border-white/10' : 'border-white/45';
  const mutedText = isDark ? 'text-[#7b8095]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#8a90a7]' : 'text-[#6b7080]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.05] text-white placeholder:text-[#848aa0]'
    : 'border-white/28 bg-white/28 text-[#11131b] placeholder:text-[#8a8f9f] backdrop-blur-3xl';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.08] backdrop-blur-2xl'
    : 'border-white/28 text-[#31374a] hover:bg-white/42 backdrop-blur-3xl';
  const subtleSurface = isDark
    ? 'border-white/10 bg-white/[0.05]'
    : 'border-white/28 bg-white/22 backdrop-blur-3xl';

  return (
    <DashboardLayout activeMenu="Settings">
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden ${pageClass}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -left-20 top-20 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-[#d9ff34]/10' : 'bg-[#d9ff34]/18'}`} />
          <div className={`absolute right-6 top-40 h-96 w-96 rounded-full blur-3xl ${isDark ? 'bg-[#8b5cf6]/10' : 'bg-[#8b5cf6]/12'}`} />
          <div className={`absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full blur-3xl ${isDark ? 'bg-[#47d7ff]/8' : 'bg-white/50'}`} />
        </div>
        <div className="relative mx-auto max-w-[1320px] p-4 pt-4 md:p-5 md:pt-6">
          <div className={`mb-6 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-[0.18em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {tt('menu.settings', 'SETTINGS')}
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('settings.subtitle', 'Preferences, security, and account control')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetPreferences}
                className={`rounded-2xl border px-5 py-3 text-sm font-bold ${outlineButton}`}
              >
                {tt('settings.resetDefaults', 'Reset to Defaults')}
              </button>
              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPrefs}
                className={`rounded-2xl px-6 py-3 text-sm font-black ${
                  savingPrefs
                    ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                    : isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
                }`}
              >
                {savingPrefs ? tt('common.saving', 'Saving...') : tt('settings.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className={`rounded-[24px] border p-6 xl:col-span-2 ${cardClass}`}>
              <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('settings.general', 'General Settings')}</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('settings.generalDesc', 'Configure your basic preferences and display options.')}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.theme', 'Theme')}
                  </label>
                  <div className="flex gap-3">
                    {['light', 'dark'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update('theme', opt)}
                        className={`rounded-2xl border px-5 py-3 text-sm font-bold capitalize ${
                          settings.theme === opt
                        ? isDark 
                            ? 'border-[#d9ff34] bg-[#d9ff34]/10 text-[#d9ff34]'
                            : 'border-[#84cc16] bg-[#84cc16]/10 text-[#84cc16]'
                            : isDark
                              ? 'border-white/10 bg-white/[0.03] text-[#d0d3e4]'
                              : 'border-black/10 bg-white text-[#31374a]'
                        }`}
                      >
                        {tt(`settings.themes.${opt}`, opt)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.language', 'Language')}
                  </label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    value={settings.language}
                    onChange={(e) => update('language', e.target.value)}
                  >
                    <option value="en">{tt('settings.lang.en', 'English')}</option>
                    <option value="th">{tt('settings.lang.th', 'Thai')}</option>
                    <option value="my">{tt('settings.lang.my', 'Burmese')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.currency', 'Currency')}
                  </label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    value={settings.currency}
                    onChange={(e) => update('currency', e.target.value)}
                  >
                    <option value="THB">THB — Thai Baht</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="MMK">MMK — Myanmar Kyat</option>
                  </select>

                  <div className={`mt-3 rounded-2xl border p-4 text-sm ${labelText} ${subtleSurface}`}>
                    <div>
                      1 THB ≈ {rates?.USD ? rates.USD.toFixed(4) : '…'} USD • {rates?.MMK ? Math.round(rates.MMK).toLocaleString() : '…'} MMK
                    </div>
                    <div className="mt-1">{tt('settings.updatedAt', 'Updated')}: {last}</div>
                    <button
                      type="button"
                      onClick={refreshRates}
                      disabled={loading}
                      className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${outlineButton}`}
                    >
                      {loading ? tt('settings.refreshing', 'Refreshing...') : tt('settings.refreshRates', 'Refresh Rates')}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.weekStart', 'Week Starts On')}
                  </label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    value={settings.weekStartsOn}
                    onChange={(e) => update('weekStartsOn', e.target.value)}
                  >
                    <option value="Sun">{tt('settings.week.sun', 'Sunday')}</option>
                    <option value="Mon">{tt('settings.week.mon', 'Monday')}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={`rounded-[24px] border p-6 ${cardClass}`}>
              <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('settings.security', 'Security')}</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('settings.securityDesc', 'Update your password and manage account safety.')}
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.pwd.current', 'Current Password')}
                  </label>
                  <input
                    type="password"
                    value={currPwd}
                    onChange={(e) => setCurrPwd(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.pwd.new', 'New Password')}
                  </label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('settings.pwd.confirm', 'Confirm New Password')}
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPwd}
                  className={`w-full rounded-2xl px-5 py-3 text-sm font-black ${
                    changingPwd
                      ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                      : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                  }`}
                >
                  {changingPwd ? tt('settings.pwd.updating', 'Updating...') : tt('settings.pwd.change', 'Change Password')}
                </button>
              </div>

              <div className={`mt-8 border-t pt-8 ${sectionDivider}`}>
                <h3 className="text-lg font-bold text-[#fb7185]">{tt('settings.deleteTitle', 'Delete Account')}</h3>
                <p className={`mt-2 text-sm ${labelText}`}>
                  {tt('settings.deleteDesc', 'This action is irreversible. Type DELETE to confirm.')}
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className={`mt-4 w-full rounded-2xl border px-4 py-3 outline-none ${
                    isDark
                      ? 'border-[#fb7185]/20 bg-[#25141a] text-white'
                      : 'border-[#fb7185]/30 bg-[#fff1f4] text-[#6f1028]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className={`mt-4 w-full rounded-2xl px-5 py-3 text-sm font-black ${
                    deleting
                      ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                      : 'bg-[#fb7185] text-white hover:bg-[#f43f5e]'
                  }`}
                >
                  {deleting ? tt('settings.deleting', 'Deleting...') : tt('settings.deleteAccount', 'Delete Account')}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
