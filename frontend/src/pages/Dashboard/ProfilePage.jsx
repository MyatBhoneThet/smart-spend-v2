import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContext";
import useT from "../../hooks/useT";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

const normalizePhoto = (profilePhoto) => {
  if (!profilePhoto) return null;
  if (profilePhoto.data) return `data:${profilePhoto.contentType};base64,${profilePhoto.data}`;
  if (typeof profilePhoto === "string" && /^(https?:|blob:|data:)/.test(profilePhoto)) return profilePhoto;
  return `${BACKEND_URL}/${profilePhoto}`;
};

const transformGenderValue = (backendValue) => {
  const map = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
    Male: "Male",
    Female: "Female",
    Other: "Other",
    "Prefer not to say": "Prefer not to say",
  };
  return map[backendValue] || "Prefer not to say";
};

export default function ProfilePage() {
  const { t } = useT();
  const tt = (key, fallback) => {
    const val = t?.(key);
    return val && val !== key ? val : fallback;
  };

  const { user, updateUser, prefs } = useContext(UserContext);
  const isDark = prefs?.theme === 'dark';
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get(API_PATHS.USER.ME)
      .then((res) => {
        const data = res.data;
        const transformed = {
          ...data,
          name: data.name || data.fullName || "",
          gender: transformGenderValue(data.gender),
          profilePhoto: normalizePhoto(data.profilePhoto),
        };
        updateUser(transformed);
        setFormData(transformed);
      })
      .catch((err) => {
        console.error(tt("profile.fetchError", "Failed to fetch profile"), err);
        toast.error(tt("profile.fetchError", "Failed to fetch profile"));
      })
      .finally(() => setLoading(false));
  }, []);

  const setField = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }));
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const data = new FormData();
    data.append("profilePhoto", file);

    const previewUrl = URL.createObjectURL(file);
    updateUser({ ...user, profilePhoto: previewUrl });
    setFormData((p) => ({ ...p, profilePhoto: previewUrl }));

    try {
      const res = await axiosInstance.post(API_PATHS.USER.UPLOAD_PHOTO, data);
      const finalUrl = normalizePhoto(res.data.user.profilePhoto);
      updateUser({ ...user, profilePhoto: finalUrl });
      setFormData((p) => ({ ...p, profilePhoto: finalUrl }));
    } catch (err) {
      console.error(tt("profile.uploadFail", "Photo upload failed"), err);
      toast.error(tt("profile.uploadFailAlert", "Failed to upload photo."));
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await axiosInstance.delete(API_PATHS.USER.REMOVE_PHOTO);
      const updated = { ...res.data.user, profilePhoto: null };
      updateUser(updated);
      setFormData((prev) => ({ ...prev, profilePhoto: null }));
    } catch (err) {
      console.error(tt("profile.removeFail", "Photo remove failed"), err);
      updateUser({ ...user, profilePhoto: null });
      setFormData((prev) => ({ ...prev, profilePhoto: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { profilePhoto, ...rest } = formData;
      const submitData = {
        ...rest,
        fullName: rest.name || rest.fullName || "",
        name: rest.name || rest.fullName || "",
        age: rest.age ? Number(rest.age) : undefined,
        gender: transformGenderValue(rest.gender),
      };

      const res = await axiosInstance.put(API_PATHS.USER.UPDATE, submitData);
      const updated = { ...res.data, profilePhoto };
      updateUser(updated);
      setFormData((prev) => ({ ...prev, ...res.data, profilePhoto }));
      toast.success(tt("profile.updateSuccess", "Profile updated successfully."));
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        tt("profile.updateFail", "Failed to save profile");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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
  const subtleSurface = isDark
    ? 'border-white/10 bg-white/[0.05]'
    : 'border-white/28 bg-white/22 backdrop-blur-3xl';

  return (
    <DashboardLayout activeMenu="Profile">
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
                {tt('menu.profile', 'PROFILE')}
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('profile.subtitle', 'Personal details and account identity')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || loading}
              className={`rounded-2xl px-6 py-3 text-sm font-black ${
                saving || loading
                  ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                  : isDark ? 'bg-[#d9ff34] text-black hover:bg-[#cbf029]' : 'bg-[#84cc16] text-white hover:bg-[#65a30d]'
              }`}
            >
              {saving ? tt('common.saving', 'Saving...') : tt('profile.save', 'Save Profile')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
            <section className={`rounded-[24px] border p-6 ${cardClass}`}>
              <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('profile.photo', 'Profile Photo')}</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('profile.photoDesc', 'Upload a clear identity photo for your account.')}
              </p>

              <div className="mt-6">
                <ProfilePhotoSelector
                  photo={formData.profilePhoto}
                  onUpload={handleUpload}
                  onRemove={handleRemovePhoto}
                />
              </div>

              <div className={`mt-6 rounded-2xl border p-5 ${subtleSurface}`}>
                <div className={`text-[11px] uppercase tracking-[0.22em] ${mutedText}`}>
                  {tt('profile.accountEmail', 'Account Email')}
                </div>
                <div className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {formData.email || user?.email || '—'}
                </div>
              </div>
            </section>

            <form
              onSubmit={handleSubmit}
              className={`rounded-[24px] border p-6 ${cardClass}`}
            >
              <h2 className={`text-[20px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>{tt('profile.personalInfo', 'Personal Information')}</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                {tt('profile.personalInfoDesc', 'Manage the public and personal fields attached to your account.')}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.fullName', 'Full Name')}
                  </label>
                  <input
                    value={formData.name || formData.fullName || ""}
                    onChange={(e) => setField("name", e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    placeholder={tt("profile.namePlaceholder", "Enter your name")}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.username', 'Username')}
                  </label>
                  <input
                    value={formData.username || ""}
                    onChange={(e) => setField("username", e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    placeholder={tt("profile.usernamePlaceholder", "Enter your username")}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.age', 'Age')}
                  </label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => setField("age", e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    placeholder={tt("profile.agePlaceholder", "Your age")}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.bio', 'Bio')}
                  </label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={(e) => setField("bio", e.target.value)}
                    rows={4}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                    placeholder={tt("profile.bioPlaceholder", "Short bio about yourself")}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.gender', 'Gender')}
                  </label>
                  <select
                    value={formData.gender || "Prefer not to say"}
                    onChange={(e) => setField("gender", e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  >
                    <option value="male">{tt('profile.genders.male', 'Male')}</option>
                    <option value="female">{tt('profile.genders.female', 'Female')}</option>
                    <option value="other">{tt('profile.genders.other', 'Other')}</option>
                    <option value="prefer_not_to_say">{tt('profile.genders.none', 'Prefer not to say')}</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    {tt('profile.email', 'Email')}
                  </label>
                  <input
                    value={formData.email || user?.email || ""}
                    readOnly
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${isDark ? 'border-white/10 bg-white/[0.03] text-[#7b8095]' : 'border-black/10 bg-[rgba(17,19,27,0.03)] text-[#6b7080]'}`}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
