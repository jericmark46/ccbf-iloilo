const configuredOrigin = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const apiOrigin = configuredOrigin;

export const apiBaseUrl = configuredOrigin
  ? `${configuredOrigin}${/\/api$/.test(configuredOrigin) ? '' : '/api'}`
  : '/api';

export const assetUrl = (value) =>
  typeof value === 'string' && configuredOrigin && value.startsWith('/uploads/')
    ? `${configuredOrigin}${value}`
    : value;
