export const ADMIN_PERMISSIONS = [
  { key: 'posts', label: 'Updates & news feed' },
  { key: 'pages', label: 'Pages' },
  { key: 'media', label: 'Media library' },
  { key: 'comments', label: 'Comments' },
  { key: 'ministries', label: 'Ministries' },
  { key: 'activities', label: 'Activities' },
  { key: 'giving', label: 'Giving' },
  { key: 'messages', label: 'Inbox' },
  { key: 'settings', label: 'Site settings' },
];

export const PERMISSION_KEYS = ADMIN_PERMISSIONS.map((item) => item.key);

export const DEFAULT_PERMISSIONS = [...PERMISSION_KEYS];

export function sanitizePermissions(value) {
  if (!Array.isArray(value)) return [...DEFAULT_PERMISSIONS];
  return [...new Set(value.filter((key) => typeof key === 'string' && PERMISSION_KEYS.includes(key)))];
}
