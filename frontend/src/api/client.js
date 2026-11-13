import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
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
