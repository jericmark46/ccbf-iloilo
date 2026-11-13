import mongoose from 'mongoose';

// One row per page view on the public website. Aggregating by `day` keeps the
// "visits this month" graph cheap, and `visitor` is a per-day salted hash so we
// can count unique visitors without storing anything that identifies a person.
const pageVisitSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, index: true }, // YYYY-MM-DD in the site's timezone
    path: { type: String, default: '/' },
    referrer: { type: String, default: '' },
    visitor: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

pageVisitSchema.index({ day: 1, path: 1 });
// Roughly 13 months of history, then the rows age out automatically.
pageVisitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

export default mongoose.model('PageVisit', pageVisitSchema);
