export const ADMIN_PERMISSIONS = [
  {
    key: 'posts',
    label: 'Updates & news feed',
    description: 'Write, edit, publish, and delete updates and feed posts.',
  },
  {
    key: 'pages',
    label: 'Pages',
    description: 'Edit the About, Give, and other website pages.',
  },
  {
    key: 'media',
    label: 'Media library',
    description: 'Upload, browse, and remove images and videos.',
  },
  {
    key: 'comments',
    label: 'Comments',
    description: 'Read and moderate comments from the church family.',
  },
  {
    key: 'ministries',
    label: 'Ministries',
    description: 'Manage ministry pages and their details.',
  },
  {
    key: 'activities',
    label: 'Activities',
    description: 'Manage the church calendar and gatherings.',
  },
  {
    key: 'giving',
    label: 'Giving',
    description: 'Manage giving options and instructions.',
  },
  {
    key: 'messages',
    label: 'Inbox',
    description: 'Read messages sent through the contact form.',
  },
  {
    key: 'settings',
    label: 'Site settings',
    description: 'Change site text, background, contact details, and appearance.',
  },
];

export const DEFAULT_PERMISSIONS = ADMIN_PERMISSIONS.map((item) => item.key);

export const permissionLabel = (key) =>
  ADMIN_PERMISSIONS.find((item) => item.key === key)?.label || key;
