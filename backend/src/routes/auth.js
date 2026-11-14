import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, assert, str } from '../utils/http.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getRequestToken,
  requireAuth,
  idleExpired,
  touchActivity,
} from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = str(req.body.email, 160).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    assert(email && password, 400, 'Email and password are required.');

    const user = await User.findOne({ email }).select('+password');
    const valid = user ? await user.comparePassword(password) : false;
    assert(valid, 401, 'The email or password is incorrect.');
    assert(user.active, 403, 'This account has been deactivated. Please contact a superadmin.');

    const now = new Date();
    user.lastLogin = now;
    user.lastActiveAt = now;
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    // Sign-in is worth recording even though it is not an admin route.
    req.user = user;
    await recordAudit({
      req,
      action: 'signed-in',
      entity: 'auth',
      label: user.email,
      summary: 'signed in to the admin',
    });

    // The token is returned as well so browsers that block third-party cookies
    // can authenticate with an Authorization: Bearer header instead.
    res.json({ user: user.toSafeJSON(), token });
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    try {
      const token = getRequestToken(req);
      if (!token) return res.json({ user: null });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || !user.active) return res.json({ user: null });
      if (idleExpired(user)) {
        clearAuthCookie(res);
        return res.json({ user: null, code: 'SESSION_IDLE' });
      }
      touchActivity(user);
      return res.json({ user: user.toSafeJSON() });
    } catch {
      return res.json({ user: null });
    }
  })
);

router.post(
  '/heartbeat',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ ok: true, user: req.user.toSafeJSON() });
  })
);

router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    const email = str(req.body.email, 160).toLowerCase();
    assert(name.length >= 2, 400, 'Please enter your name.');
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Please enter a valid email address.');

    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    assert(!existing, 409, 'That email is already used by another account.');

    req.user.name = name;
    req.user.email = email;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  })
);

router.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    assert(currentPassword, 400, 'Please enter your current password.');
    assert(newPassword.length >= 8, 400, 'Your new password must be at least 8 characters.');

    const user = await User.findById(req.user._id).select('+password');
    const valid = await user.comparePassword(currentPassword);
    assert(valid, 401, 'Your current password is incorrect.');

    user.password = newPassword;
    await user.save();
    clearAuthCookie(res);
    res.json({ ok: true, message: 'Password updated. Please sign in again.' });
  })
);

export default router;
