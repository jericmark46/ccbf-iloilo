import { Router } from 'express';
import SiteSettings from '../../models/SiteSettings.js';
import { asyncHandler, str, num } from '../../utils/http.js';

const router = Router();

const clamp = (value, min, max, fallback) => {
  const number = num(value, fallback);
  return Math.min(max, Math.max(min, number));
};

const safeUrl = (value, fallback = '') => {
  const url = str(value, 800);
  if (/^\/(?!\/)/.test(url) || /^https?:\/\//i.test(url)) return url;
  return fallback;
};

const safeMapEmbed = (value) => {
  const raw = str(value, 3000);
  if (!raw) return '';
  const source = raw.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] || raw;
  try {
    const url = new URL(source);
    const isGoogle = /(^|\.)google\.[a-z.]+$/i.test(url.hostname);
    if (url.protocol === 'https:' && isGoogle && url.pathname.startsWith('/maps')) {
      return url.toString();
    }
  } catch {
    /* invalid URL */
  }
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
    res.json({ settings: await getSettings() });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    const body = req.body || {};

    const textFields = [
      ['siteName', 80],
      ['shortName', 20],
      ['tagline', 180],
      ['heroKicker', 80],
      ['heroSubtitle', 300],
      ['footerNote', 240],
    ];
    for (const [field, max] of textFields) {
      if (body[field] !== undefined) settings[field] = str(body[field], max);
    }

    if (Array.isArray(body.heroLines)) {
      settings.heroLines = body.heroLines
        .slice(0, 4)
        .map((line) => ({ label: str(line?.label, 60), text: str(line?.text, 120) }))
        .filter((line) => line.label || line.text);
    }

    if (Array.isArray(body.heroButtons)) {
      settings.heroButtons = body.heroButtons
        .slice(0, 3)
        .map((button) => ({
          label: str(button?.label, 40),
          href: safeUrl(button?.href, '/'),
          style: ['solid', 'outline', 'ghost'].includes(button?.style) ? button.style : 'solid',
        }))
        .filter((button) => button.label);
    }

    if (body.background && typeof body.background === 'object') {
      const bg = body.background;
      if (bg.type === 'image' || bg.type === 'video') settings.background.type = bg.type;
      if (bg.url !== undefined) settings.background.url = safeUrl(bg.url, settings.background.url);
      if (bg.poster !== undefined) settings.background.poster = safeUrl(bg.poster, '');
      if (bg.overlay !== undefined) settings.background.overlay = clamp(bg.overlay, 0, 90, 52);
      if (bg.blur !== undefined) settings.background.blur = clamp(bg.blur, 0, 12, 0);
      if (bg.focal !== undefined) {
        settings.background.focal = ['center', 'top', 'bottom', 'left', 'right'].includes(bg.focal)
          ? bg.focal
          : 'center';
      }
    }

    if (body.verse && typeof body.verse === 'object') {
      if (body.verse.text !== undefined) settings.verse.text = str(body.verse.text, 400);
      if (body.verse.reference !== undefined) settings.verse.reference = str(body.verse.reference, 100);
    }

    if (Array.isArray(body.serviceTimes)) {
      settings.serviceTimes = body.serviceTimes
        .slice(0, 8)
        .map((slot) => ({
          day: str(slot?.day, 30),
          time: str(slot?.time, 60),
          label: str(slot?.label, 80),
        }))
        .filter((slot) => slot.day || slot.time || slot.label);
    }

    if (body.contact && typeof body.contact === 'object') {
      for (const field of ['address', 'phone', 'email']) {
        if (body.contact[field] !== undefined) settings.contact[field] = str(body.contact[field], 200);
      }
      if (body.contact.people !== undefined) {
        settings.contact.people = (Array.isArray(body.contact.people) ? body.contact.people : [])
          .slice(0, 10)
          .map((person) => ({
            name: str(person?.name, 80),
            role: str(person?.role, 80),
            email: str(person?.email, 160),
            phone: str(person?.phone, 60),
          }))
          .filter((person) => person.name || person.email || person.phone);
      }
      if (body.contact.mapUrl !== undefined) settings.contact.mapUrl = safeUrl(body.contact.mapUrl, '');
      if (body.contact.mapEmbed !== undefined) {
        settings.contact.mapEmbed = safeMapEmbed(body.contact.mapEmbed);
      }
      if (body.contact.expectTitle !== undefined) {
        settings.contact.expectTitle = str(body.contact.expectTitle, 80);
      }
      if (body.contact.expectations !== undefined) {
        settings.contact.expectations = (Array.isArray(body.contact.expectations)
          ? body.contact.expectations
          : []
        )
          .slice(0, 8)
          .map((item) => str(item, 240))
          .filter(Boolean);
      }
    }

    if (body.socials && typeof body.socials === 'object') {
      for (const field of ['facebook', 'instagram', 'youtube', 'tiktok']) {
        if (body.socials[field] !== undefined) settings.socials[field] = safeUrl(body.socials[field], '');
      }
    }

    if (Array.isArray(body.announcements)) {
      settings.announcements = body.announcements
        .slice(0, 3)
        .map((item) => ({
          text: str(item?.text, 180),
          href: safeUrl(item?.href, ''),
          active: item?.active !== false,
        }))
        .filter((item) => item.text);
    }

    if (body.copy && typeof body.copy === 'object' && !Array.isArray(body.copy)) {
      const nextCopy = {};
      for (const [key, value] of Object.entries(body.copy).slice(0, 160)) {
        if (!/^[a-z][a-z0-9_]{1,59}$/i.test(key) || typeof value !== 'string') continue;
        nextCopy[key] = key.endsWith('_image') ? safeUrl(value, '') : str(value, 1200);
      }
      settings.copy = nextCopy;
    }

    if (body.theme && typeof body.theme === 'object') {
      if (['light', 'dark', 'system', 'midnight', 'sepia'].includes(body.theme.defaultMode)) {
        settings.theme.defaultMode = body.theme.defaultMode;
      }
      if (['gold', 'ocean', 'forest', 'rose'].includes(body.theme.accent)) {
        settings.theme.accent = body.theme.accent;
      }
    }

    await settings.save();
    res.json({ settings });
  })
);

export default router;
