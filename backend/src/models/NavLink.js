import mongoose from 'mongoose';

const navLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    href: { type: String, required: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'NavLink', default: null, index: true },
    order: { type: Number, default: 0, index: true },
    visible: { type: Boolean, default: true },
    external: { type: Boolean, default: false },
    openInNewTab: { type: Boolean, default: false },
    description: { type: String, default: '', maxlength: 120 },
  },
  { timestamps: true, versionKey: false }
);

navLinkSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.parent) ret.parent = ret.parent.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('NavLink', navLinkSchema);
