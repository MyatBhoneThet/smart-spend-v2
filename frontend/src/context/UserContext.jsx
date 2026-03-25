import React, { createContext, useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { getStoredToken } from '../utils/authSession';

export const UserContext = createContext();

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

const DEFAULT_PREFS = {
  currency: 'THB',
  language: 'en',
  weekStartsOn: 'Mon',
  theme: localStorage.getItem('theme') || 'light',
};

// 🔑 normalize photo fileId into API URL
const normalizePhoto = (fileId) => {
  if (!fileId) return null;
  if (typeof fileId === 'object' && fileId?.data && fileId?.contentType) {
    return `data:${fileId.contentType};base64,${fileId.data}`;
  }
  if (typeof fileId === 'string' && /^(https?:|blob:|data:)/.test(fileId)) {
    return fileId;
  }
  return `${BACKEND_URL}/${fileId}`;
};

export default function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  // Load user and saved prefs on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) setPrefs((p) => ({ ...p, ...JSON.parse(saved) }));
    } catch {
        // ignore
    }

    const token = getStoredToken();
    if (!token) return;

    axiosInstance
      .get(API_PATHS.AUTH.GET_USER_INFO)
      .then(({ data }) => {
        setUser({
          ...data,
          profilePhoto: normalizePhoto(data.profilePhoto),
        });
        // Merge prefs that might come from backend
        setPrefs((p) => ({
          ...p,
          currency: data?.currency ?? p.currency,
          theme: data?.theme ?? p.theme,
          weekStartsOn: data?.weekStartsOn ?? p.weekStartsOn,
          language: data?.language ?? p.language,
        }));
      })
      .catch(() => {});
  }, []);

  // Globally toggle Tailwind dark mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.theme === 'dark');
    localStorage.setItem('theme', prefs.theme);
  }, [prefs.theme]);

  // Wrap updates so they also normalize photo
  const updateUser = (u) => {
    setUser({
      ...u,
      profilePhoto: normalizePhoto(u?.profilePhoto),
    });
  };

  const clearUser = () => setUser(null);

  const updatePrefs = (next) => {
    setPrefs(next);
    localStorage.setItem('appSettings', JSON.stringify(next));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, clearUser, prefs, updatePrefs }}>
      {children}
    </UserContext.Provider>
  );
}
