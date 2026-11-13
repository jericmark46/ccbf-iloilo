import mongoose from 'mongoose';

// Categories are managed in the database (see models/UpdateCategory.js) so the
// church can add, rename, hide, or remove them from the admin instead of asking
// for a code change. `category` stays a plain string so existing updates keep
// their label even if the category is later hidden or deleted.
const postSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true, maxlength: 160 },
    content: { type: String, required: true, trim: true },
    category: { type: String, default: 'Announcement', trim: true, maxlength: 40, index: true },
    coverImage: { type: String, default: '' },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    pinned: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'Church Admin' },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

postSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.author) ret.author = ret.author.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Post', postSchema);
