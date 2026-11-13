import axios from 'axios';
import { apiBaseUrl, assetUrl } from '../lib/urls';

const TOKEN_KEY = 'cc_admin_token';

// The API lives on its own domain, so browsers that block third-party cookies
// never keep the session cookie. The JWT is mirrored here and sent as a bearer
// token so the admin stays signed in regardless of the cookie policy.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

// Rewrite backend-served /uploads/* paths so media resolves against the API origin.
const absolutizeMedia = (value) => {
  if (typeof value === 'string') return assetUrl(value);
  if (Array.isArray(value)) return value.map(absolutizeMedia);
  if (value && typeof value === 'object' && value.constructor === Object) {
    for (const key of Object.keys(value)) value[key] = absolutizeMedia(value[key]);
    return value;
  }
  return value;
};

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object') {
      response.data = absolutizeMedia(response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // A 401 here means the stored token is gone or rejected. Credential checks
    // such as /auth/login and /auth/password use 401 for a bad password too, so
    // they are deliberately excluded.
    const isSessionProbe = /^\/admin\b/.test(url) || /^\/auth\/(me|profile)$/.test(url);
    if (status === 401 && isSessionProbe) {
      tokenStore.clear();
      if (url !== '/auth/me') window.dispatchEvent(new CustomEvent('cc:session-expired'));
    }
    const friendlyMessage =
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED'
        ? 'The request took too long. Please try again.'
        : 'Unable to reach the server. Please check your connection.');
    error.friendlyMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

export const getError = (error) =>
  error?.friendlyMessage || error?.response?.data?.error || error?.message || 'Something went wrong.';
