import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const COOKIE_NAME = 'cc_token';

// On Vercel the admin UI and the API are separate sites (vercel.app is on the
// public suffix list, so two *.vercel.app subdomains do not count as one site).
// A Lax cookie is therefore rejected there with "rejected because it is in a
// cross-site context", so None + Secure is forced on that deployment regardless
// of COOKIE_SAMESITE. Locally the cookie stays Lax and non-secure so plain
// http://localhost keeps working.
const onVercel = Boolean(process.env.VERCEL);
const sameSite = onVercel ? 'none' : String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
// SameSite=None is only stored when it is paired with Secure; a mismatch makes
// the browser drop the cookie entirely.
const secure = onVercel || sameSite === 'none' || process.env.COOKIE_SECURE === 'true';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/', sameSite, secure });
}

// Cross-site deployments (for example a Vercel frontend on a different domain)
// can have the auth cookie dropped by third-party cookie blocking, so the same
// JWT is also accepted from the Authorization header.
export function getRequestToken(req) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return req.cookies?.[COOKIE_NAME] || bearer || null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getRequestToken(req);
    if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Your session is no longer valid. Please sign in again.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to do that.' });
  }
  next();
};
