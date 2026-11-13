import clsx from 'clsx';

export const cn = (...values) => clsx(values);

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

export const pickFirst = (value, fallback = '') => {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
};

export const safeExternal = (url = '') => /^https?:\/\//i.test(url);
