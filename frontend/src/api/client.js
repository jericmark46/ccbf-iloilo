import axios from 'axios';
import { apiBaseUrl, assetUrl } from '../lib/urls';

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

api.interceptors.response.use(
  (response) => {
    if (response?.data && typeof response.data === 'object') {
      response.data = absolutizeMedia(response.data);
    }
    return response;
  },
  (error) => {
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
