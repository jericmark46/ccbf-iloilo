import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

commentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.post) ret.post = ret.post.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('Comment', commentSchema);
