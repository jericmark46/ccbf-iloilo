import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: 'Gathering', maxlength: 60 },
    location: { type: String, default: '' },
    startAt: { type: Date, required: true },
    endAt: Date,
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

activitySchema.index({ startAt: 1 });

activitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Activity', activitySchema);
