const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);

const FACEBOOK_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'fb.watch',
]);

export const VIDEO_FILE_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

export const isVideoUrl = (url = '') => VIDEO_FILE_RE.test(String(url));

export const providerLabel = (provider) =>
  ({
    youtube: 'YouTube',
    gdrive: 'Google Drive',
    facebook: 'Facebook',
    file: 'Uploaded video',
  })[provider] || '';

function youtubeId(parsed) {
  if (parsed.hostname.toLowerCase() === 'youtu.be') {
    return parsed.pathname.split('/').filter(Boolean)[0] || '';
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts[0] === 'watch') return parsed.searchParams.get('v') || '';
  if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) return parts[1] || '';
  return '';
}

function driveId(parsed) {
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts[0] === 'file' && parts[1] === 'd') return parts[2] || '';
  if (parts[0] === 'open' || parts[0] === 'uc') return parsed.searchParams.get('id') || '';
  return '';
}

function isFacebookVideo(parsed) {
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;
  if (host === 'fb.watch') return /^\/[A-Za-z0-9_-]+\/?$/.test(path);
  if (/^\/(photo|photo\.php|stories?|story\.php)(\/|$)/i.test(path)) return false;
  return (
    /\/videos\/\d+/.test(path) ||
    /\/reel\/\d+/.test(path) ||
    (/^\/watch\/?$/i.test(path) && Boolean(parsed.searchParams.get('v'))) ||
    /^\/share\/[vr]\/[A-Za-z0-9_-]+/i.test(path)
  );
}

/** Client-side mirror of the server check, used only to guide the admin UI. */
export function detectVideoProvider(input = '') {
  const url = String(input || '').trim();
  if (!url) return null;

  if (/^\/(?!\/)/.test(url)) {
    return /^\/uploads\//i.test(url) && VIDEO_FILE_RE.test(url) ? { provider: 'file' } : null;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;

  const host = parsed.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    return YOUTUBE_ID_RE.test(youtubeId(parsed)) ? { provider: 'youtube' } : null;
  }
  if (DRIVE_HOSTS.has(host)) {
    return DRIVE_ID_RE.test(driveId(parsed)) ? { provider: 'gdrive' } : null;
  }
  if (FACEBOOK_HOSTS.has(host)) {
    return isFacebookVideo(parsed) ? { provider: 'facebook' } : null;
  }
  if (VIDEO_FILE_RE.test(parsed.pathname)) return { provider: 'file' };
  return null;
}
