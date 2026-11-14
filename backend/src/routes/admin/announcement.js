import { Router } from 'express';
import SiteSettings from '../../models/SiteSettings.js';
import { asyncHandler, assert, str } from '../../utils/http.js';

const router = Router();

const safeUrl = (value) => {
  const url = str(value, 800);
  if (/^\/(?!\/)/.test(url) || /^https?:\/\//i.test(url)) return url;
  return '';
};

async function getSettings() {
  let settings = await SiteSettings.findOne({ key: 'site' });
  if (!settings) settings = await SiteSettings.create({ key: 'site' });
  return settings;
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json({ announcement: settings.specialAnnouncement });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    const current = settings.specialAnnouncement || {};

    const next = {
      enabled: req.body.enabled === true,
      title: str(req.body.title, 120),
      message: str(req.body.message, 1200),
      image: safeUrl(req.body.image),
    };

    if (next.enabled) {
      assert(next.title.length >= 2, 400, 'Please enter a title for the announcement.');
      assert(next.message.length >= 3, 400, 'Please write the announcement message.');
    }

    const contentChanged =
      next.title !== (current.title || '') ||
      next.message !== (current.message || '') ||
      next.image !== (current.image || '');

    settings.specialAnnouncement = {
      ...next,
      version: contentChanged ? (current.version || 0) + 1 : current.version || 0,
      updatedAt: contentChanged ? new Date() : current.updatedAt || null,
    };

    await settings.save();
    res.json({ announcement: settings.specialAnnouncement });
  })
);

export default router;
