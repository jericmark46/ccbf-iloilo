import { Router } from 'express';
import User from '../../models/User.js';
import { asyncHandler, assert, str, bool } from '../../utils/http.js';
import { sanitizePermissions } from '../../utils/permissions.js';

const router = Router();
const ROLES = ['superadmin', 'admin'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function otherActiveSuperadmins(excludeId) {
  return User.countDocuments({
    role: 'superadmin',
    active: true,
    _id: { $ne: excludeId },
  });
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ role: 1, createdAt: 1 });
    res.json({ users });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = str(req.body.name, 80);
    const email = str(req.body.email, 160).toLowerCase();
    const password = String(req.body.password || '');
    const role = ROLES.includes(req.body.role) ? req.body.role : 'admin';
    const permissions = sanitizePermissions(req.body.permissions);

    assert(name.length >= 2, 400, 'Please enter the account holder’s name.');
    assert(emailPattern.test(email), 400, 'Please enter a valid email address.');
    assert(password.length >= 8, 400, 'The password must be at least 8 characters.');

    const exists = await User.exists({ email });
    assert(!exists, 409, 'An account with that email already exists.');

    const user = await User.create({ name, email, password, role, permissions });
    res.status(201).json({ user: user.toSafeJSON() });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    assert(user, 404, 'That account could not be found.');

    const isSelf = String(user._id) === String(req.user._id);
    const nextRole = ROLES.includes(req.body.role) ? req.body.role : user.role;
    const nextActive = req.body.active !== undefined ? bool(req.body.active, true) : user.active;

    if (user.role === 'superadmin' && (nextRole !== 'superadmin' || !nextActive)) {
      assert(!isSelf, 400, 'You cannot demote or deactivate your own account.');
      assert((await otherActiveSuperadmins(user._id)) > 0, 400, 'At least one active superadmin must remain.');
    }

    if (req.body.name !== undefined) {
      const name = str(req.body.name, 80);
      assert(name.length >= 2, 400, 'Please enter the account holder’s name.');
      user.name = name;
    }
    if (req.body.email !== undefined) {
      const email = str(req.body.email, 160).toLowerCase();
      assert(emailPattern.test(email), 400, 'Please enter a valid email address.');
      if (email !== user.email) {
        const exists = await User.exists({ email, _id: { $ne: user._id } });
        assert(!exists, 409, 'An account with that email already exists.');
        user.email = email;
      }
    }
    if (req.body.role !== undefined) user.role = nextRole;
    if (req.body.permissions !== undefined) user.permissions = sanitizePermissions(req.body.permissions);
    if (req.body.active !== undefined) user.active = nextActive;

    await user.save();
    res.json({ user: user.toSafeJSON() });
  })
);

router.patch(
  '/:id/password',
  asyncHandler(async (req, res) => {
    const password = String(req.body.password || '');
    assert(password.length >= 8, 400, 'The password must be at least 8 characters.');

    const user = await User.findById(req.params.id);
    assert(user, 404, 'That account could not be found.');

    user.password = password;
    await user.save();
    res.json({ ok: true, message: 'Password updated.' });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    assert(user, 404, 'That account could not be found.');
    assert(String(user._id) !== String(req.user._id), 400, 'You cannot delete your own account.');

    if (user.role === 'superadmin') {
      assert((await otherActiveSuperadmins(user._id)) > 0, 400, 'At least one active superadmin must remain.');
    }

    await user.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
