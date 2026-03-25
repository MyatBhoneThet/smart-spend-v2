import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
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
      const res = await axiosInstance.post(API_PATHS.USER.UPLOAD_PHOTO, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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

  const cardClass = isDark
    ? 'border-white/8 bg-[#11131b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
    : 'border-black/8 bg-[rgba(255,253,247,0.96)] text-[#11131b] shadow-[0_16px_40px_rgba(15,23,42,0.08)]';
  const sectionDivider = isDark ? 'border-white/8' : 'border-black/8';
  const mutedText = isDark ? 'text-[#6c7086]' : 'text-[#6b6f80]';
  const labelText = isDark ? 'text-[#7b8095]' : 'text-[#6b7080]';
  const inputClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-white'
    : 'border-black/10 bg-white text-[#11131b]';
  const subtleSurface = isDark
    ? 'border-white/8 bg-white/[0.03]'
    : 'border-black/8 bg-[rgba(17,19,27,0.03)]';

  return (
    <DashboardLayout activeMenu="Profile">
      <div className={`absolute inset-0 overflow-y-auto ${isDark ? 'bg-[#090b11] text-white' : 'bg-[#f6f1e8] text-[#11131b]'}`}>
        <div className="mx-auto max-w-[1500px] p-4 pt-6 md:p-8 md:pt-10">
          <div className={`mb-8 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-start md:justify-between ${sectionDivider}`}>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                PROFILE
              </h1>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Personal details and account identity
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || loading}
              className={`rounded-2xl px-6 py-3 text-sm font-black ${
                saving || loading
                  ? 'cursor-not-allowed bg-white/10 text-[#7b8095]'
                  : 'bg-[#d9ff34] text-black hover:bg-[#cbf029]'
              }`}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className={`rounded-[28px] border p-8 ${cardClass}`}>
              <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Profile Photo</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Upload a clear identity photo for your account.
              </p>

              <div className="mt-8">
                <ProfilePhotoSelector
                  photo={formData.profilePhoto}
                  onUpload={handleUpload}
                  onRemove={handleRemovePhoto}
                />
              </div>

              <div className={`mt-8 rounded-2xl border p-5 ${subtleSurface}`}>
                <div className={`text-[11px] uppercase tracking-[0.22em] ${mutedText}`}>
                  Account Email
                </div>
                <div className={`mt-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>
                  {formData.email || user?.email || '—'}
                </div>
              </div>
            </section>

            <form
              onSubmit={handleSubmit}
              className={`rounded-[28px] border p-8 ${cardClass}`}
            >
              <h2 className={`text-[22px] font-bold ${isDark ? 'text-white' : 'text-[#11131b]'}`}>Personal Information</h2>
              <p className={`mt-2 text-sm ${mutedText}`}>
                Manage the public and personal fields attached to your account.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Full Name
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
                    Username
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
                    Age
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
                    Bio
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
                    Gender
                  </label>
                  <select
                    value={formData.gender || "Prefer not to say"}
                    onChange={(e) => setField("gender", e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none ${inputClass}`}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-xs font-semibold uppercase tracking-[0.18em] ${labelText}`}>
                    Email
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
