import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import useT from '../../hooks/useT';
import DashboardLayout from '../../components/layouts/DashboardLayout';
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
  const cardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const sectionDivider = isDark ? 'border-white/8' : 'border-black/8';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-white'
    : 'border-black/10 bg-white text-[#11131b]';
  const outlineButton = isDark
    ? 'border-white/10 text-[#d0d3e4] hover:bg-white/[0.05]'
    : 'border-black/10 text-[#31374a] hover:bg-black/[0.04]';
  const subtleSurface = isDark
    ? 'border-white/8 bg-white/[0.03]'
    : 'border-black/8 bg-[rgba(17,19,27,0.03)]';

  return (
    <DashboardLayout activeMenu="Settings">
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto max-w-[1600px] p-4 pt-6 md:p-8 md:pt-10">
          <div className={`mb-8 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SETTINGS
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Preferences, security, and account control
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetPreferences}
                className={`rounded-2xl border px-5 py-3 text-sm font-bold ${outlineButton}`}
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={savePreferences}
                disabled={savingPrefs}
                className={`rounded-2xl px-6 py-3 text-sm font-black ${
                  savingPrefs
                    ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                    : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
                }`}
              >
                {savingPrefs ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <section className={`rounded-[28px] border p-8 xl:col-span-2 ${cardClass}`}>
              <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>General Settings</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Configure your basic preferences and display options.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {['light', 'dark'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update('theme', opt)}
                        className={`rounded-2xl border px-5 py-3 text-sm font-bold capitalize ${
                          settings.theme === opt
                            ? 'border-[#d9ff34] bg-[#d9ff34]/10 text-[#d9ff34]'
                            : isDark
                              ? 'border-white/10 bg-white/[0.03] text-[#d0d3e4]'
                              : 'border-black/10 bg-white text-[#31374a]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Language
                  </label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    value={settings.language}
                    onChange={(e) => update('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="th">Thai</option>
                    <option value="my">Burmese</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Currency
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
                    <div className="mt-1">Updated: {last}</div>
                    <button
                      type="button"
                      onClick={refreshRates}
                      disabled={loading}
                      className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${outlineButton}`}
                    >
                      {loading ? 'Refreshing...' : 'Refresh Rates'}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Week Starts On
                  </label>
                  <select
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    value={settings.weekStartsOn}
                    onChange={(e) => update('weekStartsOn', e.target.value)}
                  >
                    <option value="Sun">Sunday</option>
                    <option value="Mon">Monday</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={`rounded-[28px] border p-8 ${cardClass}`}>
              <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Security</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Update your password and manage account safety.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Current Password
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
                    New Password
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
                    Confirm New Password
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
                  {changingPwd ? 'Updating...' : 'Change Password'}
                </button>
              </div>

              <div className={`mt-8 border-t pt-8 ${sectionDivider}`}>
                <h3 className="text-lg font-bold text-[#fb7185]">Delete Account</h3>
                <p className={`mt-2 text-sm ${labelText}`}>
                  This action is irreversible. Type DELETE to confirm.
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
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
