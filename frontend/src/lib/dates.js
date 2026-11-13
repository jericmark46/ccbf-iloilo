const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '');
export const formatShortDate = (value) => (value ? shortDateFormatter.format(new Date(value)) : '');
export const formatTime = (value) => (value ? timeFormatter.format(new Date(value)) : '');

export const formatDateTime = (value) =>
  value ? `${formatDate(value)} · ${formatTime(value)}` : '';

export const relativeTime = (value) => {
  if (!value) return '';
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit);
    }
  }
  return 'just now';
};

export const dateParts = (value) => {
  const date = value ? new Date(value) : new Date();
  return {
    month: new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat('en-PH', { day: '2-digit' }).format(date),
    weekday: new Intl.DateTimeFormat('en-PH', { weekday: 'long' }).format(date),
    year: date.getFullYear(),
  };
};

export const isUpcoming = (value) => value && new Date(value).getTime() >= Date.now() - 1000 * 60 * 60 * 3;

export const toDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
