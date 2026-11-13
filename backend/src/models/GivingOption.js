import mongoose from 'mongoose';

const givingOptionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    anchor: { type: String, default: '', trim: true },
    method: {
      type: String,
      enum: ['gcash', 'bank', 'paypal', 'cash', 'in-person', 'other'],
      default: 'other',
    },
    description: { type: String, default: '', maxlength: 400 },
    accountName: { type: String, default: '', maxlength: 120 },
    accountNumber: { type: String, default: '', maxlength: 80 },
    instructions: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

givingOptionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('GivingOption', givingOptionSchema);
