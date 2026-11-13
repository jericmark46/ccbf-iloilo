import mongoose from 'mongoose';

const ministrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: { type: String, default: '', maxlength: 180 },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    leader: { type: String, default: '' },
    schedule: { type: String, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

ministrySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Ministry', ministrySchema);
