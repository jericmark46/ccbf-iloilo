import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DEFAULT_PERMISSIONS } from '../utils/permissions.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin', index: true },
    permissions: { type: [String], default: () => [...DEFAULT_PERMISSIONS] },
    active: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
    lastLogin: Date,
    lastActiveAt: Date,
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    permissions: this.permissions || [],
    active: this.active,
    avatar: this.avatar,
    lastLogin: this.lastLogin,
    lastActiveAt: this.lastActiveAt,
    createdAt: this.createdAt,
  };
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
