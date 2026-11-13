export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const assert = (condition, status, message) => {
  if (!condition) throw new HttpError(status, message);
};

export const str = (value, max = 5000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const bool = (value, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

export const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 9));
  return { page, limit, skip: (page - 1) * limit };
};

export const pickDefined = (source, keys) => {
  const out = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};
