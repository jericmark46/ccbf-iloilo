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

const VIDEO_FILE_RE = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

const result = (provider, embedUrl, externalId = '') => ({ provider, embedUrl, externalId });

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

function facebookTarget(parsed) {
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (host === 'fb.watch') {
    const token = path.split('/').filter(Boolean)[0] || '';
    if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
    return { canonical: `https://fb.watch/${token}/`, externalId: token };
  }

  // Photo/story links cannot be embedded as a video player.
  if (/^\/(photo|photo\.php|stories?|story\.php)(\/|$)/i.test(path)) return null;

  const idMatch = path.match(/\/videos\/(\d+)/) || path.match(/\/reel\/(\d+)/);
  const isWatch = /^\/watch\/?$/i.test(path) && Boolean(parsed.searchParams.get('v'));
  const isShare = /^\/share\/[vr]\/[A-Za-z0-9_-]+/i.test(path);
  if (!idMatch && !isWatch && !isShare) return null;

  return {
    canonical: `https://${host}${path}${parsed.search}`,
    externalId: idMatch?.[1] || parsed.searchParams.get('v') || '',
  };
}

/**
 * Recognises a supported video source and builds a safe embed URL from it.
 * The returned embedUrl is always constructed from an allowlisted host and a
 * validated id; a raw client string is never copied into an iframe source.
 */
export function detectVideoProvider(input = '') {
  const url = String(input || '').trim();
  if (!url) return null;

  if (/^\/(?!\/)/.test(url)) {
    return /^\/uploads\//i.test(url) && VIDEO_FILE_RE.test(url) ? result('file', url) : null;
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
    const id = youtubeId(parsed);
    if (!YOUTUBE_ID_RE.test(id)) return null;
    return result(
      'youtube',
      `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      id
    );
  }

  if (DRIVE_HOSTS.has(host)) {
    const id = driveId(parsed);
    if (!DRIVE_ID_RE.test(id)) return null;
    return result('gdrive', `https://drive.google.com/file/d/${id}/preview`, id);
  }

  if (FACEBOOK_HOSTS.has(host)) {
    const target = facebookTarget(parsed);
    if (!target) return null;
    return result(
      'facebook',
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(target.canonical)}&show_text=false`,
      target.externalId
    );
  }

  if (VIDEO_FILE_RE.test(parsed.pathname)) return result('file', url);
  return null;
}

/**
 * Turns one admin-submitted media item into the shape stored on a post.
 * Returns null for an empty URL or for a video whose link is not a supported
 * provider (the route rejects those with a friendly message).
 */
export function normalizeMediaItem(item) {
  const url = typeof item?.url === 'string' ? item.url.trim().slice(0, 600) : '';
  if (!url) return null;

  const safe = /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  if (!safe) return null;

  const detected = detectVideoProvider(url);
  if (detected) {
    return {
      url,
      type: 'video',
      provider: detected.provider,
      embedUrl: detected.embedUrl,
      externalId: detected.externalId,
    };
  }

  if (item?.type === 'video') return null;

  return { url, type: 'image', provider: null, embedUrl: '', externalId: '' };
}

export const isVideoFileUrl = (url = '') => VIDEO_FILE_RE.test(String(url));
