import crypto from 'node:crypto';
import PageVisit from '../models/PageVisit.js';

// The church is in the Philippines, so a "day" should roll over at midnight in
// Iloilo rather than in UTC.
export const SITE_TIMEZONE = process.env.SITE_TIMEZONE || 'Asia/Manila';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `2026-11-13` for a given instant, in the church's timezone. */
export const dayKey = (date = new Date()) => dayFormatter.format(date);

export const monthKey = (date = new Date()) => dayKey(date).slice(0, 7);

export const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * A salted, per-day hash of the visitor's address and browser. It is enough to
 * count uniques for a day and impossible to reuse tomorrow, so nobody can be
 * followed around the site.
 */
export function visitorHash(req, day = dayKey()) {
  const salt = process.env.VISIT_SALT || process.env.JWT_SECRET || 'calvary-chapel-iloilo';
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    '';
  const agent = String(req.headers['user-agent'] || '');
  return crypto.createHash('sha256').update(`${salt}|${ip}|${agent}|${day}`).digest('hex').slice(0, 20);
}

const BOT_PATTERN =
  /bot|crawler|spider|crawl|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegram|discord|headless|lighthouse|gtmetrix|pingdom/i;

export const isBot = (req) => BOT_PATTERN.test(String(req.headers['user-agent'] || ''));

/** Normalises a tracked path so `/updates` and `/updates?page=2` count together. */
export function normalizePath(value) {
  const raw = String(value || '/').split('?')[0].split('#')[0].trim();
  if (!raw || !raw.startsWith('/')) return '/';
  // Trim the trailing slash except for the root itself.
  return raw.length > 1 ? raw.replace(/\/+$/, '') || '/' : '/';
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Daily views, unique visitors, totals and the busiest pages for one month.
 * Days without traffic are filled in with zeros so the chart has a steady axis.
 */
export async function monthlyVisitReport(month) {
  const today = dayKey();
  const requested = /^\d{4}-\d{2}$/.test(month || '') ? month : today.slice(0, 7);
  const [year, monthNumber] = requested.split('-').map(Number);
  const total = daysInMonth(year, monthNumber);

  const isCurrentMonth = requested === today.slice(0, 7);
  // Don't chart days that have not happened yet.
  const lastDay = isCurrentMonth ? Number(today.slice(8, 10)) : total;
  const first = `${requested}-01`;
  const last = `${requested}-${String(lastDay).padStart(2, '0')}`;
  const match = { day: { $gte: first, $lte: last } };

  const previousMonthDate = new Date(Date.UTC(year, monthNumber - 2, 1));
  const previousKey = `${previousMonthDate.getUTCFullYear()}-${String(previousMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const previousDays = daysInMonth(
    previousMonthDate.getUTCFullYear(),
    previousMonthDate.getUTCMonth() + 1
  );
  const previousMatch = {
    day: { $gte: `${previousKey}-01`, $lte: `${previousKey}-${String(previousDays).padStart(2, '0')}` },
  };

  const [daily, totalViews, visitors, topPages, previousViews, previousVisitors] = await Promise.all([
    PageVisit.aggregate([
      { $match: match },
      { $group: { _id: '$day', views: { $sum: 1 }, people: { $addToSet: '$visitor' } } },
      { $sort: { _id: 1 } },
    ]),
    PageVisit.countDocuments(match),
    PageVisit.distinct('visitor', match),
    PageVisit.aggregate([
      { $match: match },
      { $group: { _id: '$path', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
    ]),
    PageVisit.countDocuments(previousMatch),
    PageVisit.distinct('visitor', previousMatch),
  ]);

  const byDay = new Map(daily.map((row) => [row._id, row]));
  const days = [];
  for (let index = 1; index <= lastDay; index += 1) {
    const key = `${requested}-${String(index).padStart(2, '0')}`;
    const row = byDay.get(key);
    days.push({
      day: key,
      date: index,
      views: row?.views || 0,
      visitors: row?.people?.length || 0,
    });
  }

  const peak = days.reduce((best, day) => (day.views > best.views ? day : best), { views: 0, day: '' });

  return {
    month: requested,
    label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
    timezone: SITE_TIMEZONE,
    isCurrentMonth,
    days,
    totalViews,
    uniqueVisitors: visitors.filter(Boolean).length,
    previous: { month: previousKey, totalViews: previousViews, uniqueVisitors: previousVisitors.filter(Boolean).length },
    topPages: topPages.map((row) => ({ path: row._id || '/', views: row.views })),
    peakDay: peak.views > 0 ? peak : null,
  };
}
