import mongoose from 'mongoose';

// Used to seed a fresh install (and to back-fill any database that still runs
// on the old hardcoded list). After that, the list lives in the database and the
// church edits it from Admin → Navigation.
export const DEFAULT_CATEGORY_NAMES = [
  'Announcement',
  'Event',
  'Sermon',
  'Ministry',
  'Testimony',
  'Outreach',
  'General',
];

const updateCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    order: { type: Number, default: 0, index: true },
    // Hidden categories keep their name on existing updates but are removed
    // from the public filters and from the "new update" picker.
    visible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

updateCategorySchema.index({ slug: 1 }, { unique: true });

updateCategorySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('UpdateCategory', updateCategorySchema);
