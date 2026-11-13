import {
  Activity as ActivityIcon,
  CalendarDays,
  FileText,
  HandCoins,
  HeartHandshake,
  Image,
  Inbox,
  Link2,
  MessageCircle,
  NotebookPen,
  Settings2,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react';

/** How each part of the admin is named in the activity log. */
export const ENTITY_META = {
  posts: { label: 'Updates', icon: NotebookPen },
  pages: { label: 'Pages', icon: FileText },
  ministries: { label: 'Ministries', icon: HeartHandshake },
  activities: { label: 'Activities', icon: CalendarDays },
  giving: { label: 'Giving', icon: HandCoins },
  media: { label: 'Media library', icon: Image },
  comments: { label: 'Comments', icon: MessageCircle },
  messages: { label: 'Inbox', icon: Inbox },
  settings: { label: 'Site settings', icon: Settings2 },
  nav: { label: 'Navigation', icon: Link2 },
  categories: { label: 'Update categories', icon: Tags },
  users: { label: 'Staff accounts', icon: Users },
  auth: { label: 'Sign-ins', icon: ShieldCheck },
};

export const entityMeta = (entity) => ENTITY_META[entity] || { label: entity || 'Other', icon: ActivityIcon };

const ACTION_TONES = {
  created: 'success',
  updated: 'accent',
  deleted: 'danger',
  reordered: 'warning',
  'signed-in': 'default',
};

const ACTION_TILE_TONES = {
  created: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  updated: 'bg-accent/10 text-accent',
  deleted: 'bg-red-500/10 text-red-500',
  reordered: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  'signed-in': 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
};

export const actionTone = (action) => ACTION_TONES[action] || 'default';
export const actionTileTone = (action) => ACTION_TILE_TONES[action] || 'bg-ink/5 text-soft';
