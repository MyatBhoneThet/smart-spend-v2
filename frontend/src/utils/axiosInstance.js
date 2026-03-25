// src/utils/axiosInstance.js
import axios from 'axios';
import { BASE_URL } from './apiPaths';
import { clearStoredToken, getStoredToken } from './authSession';

const axiosInstance = axios.create({
  baseURL: BASE_URL, // http://localhost:8000 || render link
  timeout: 30000,
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (!isFormData) {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
    } else {
      delete config.headers['Content-Type']; // browser sets it
    }

    if (import.meta.env.DEV) {
      console.log(
        '[API] →',
        config.method?.toUpperCase(),
        `${config.baseURL}${config.url}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    if (import.meta.env.DEV) {
      console.error(
        '[API ERROR]',
        status,
        url,
        error?.response?.data || error.message
      );
    }

    // Auto logout on token expiry
    if (
      status === 401 &&
      !/\/api\/v1\/auth\/(login|register|google|github|me)$/i.test(url)
    ) {
      clearStoredToken();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
