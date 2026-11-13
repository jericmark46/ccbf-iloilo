import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    originalName: { type: String, default: '' },
    filename: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mime: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false }
);

mediaSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.uploadedBy) ret.uploadedBy = ret.uploadedBy.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Media', mediaSchema);
