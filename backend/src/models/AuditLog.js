import mongoose from 'mongoose';

// Every change an administrator makes to the website is stored here so the
// superadmin has a trustworthy record of who did what and when. Entries are
// append-only: nothing in the API can edit or delete them.
const auditLogSchema = new mongoose.Schema(
  {
    // Who
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorName: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: '' },

    // What
    action: { type: String, required: true, index: true }, // created | updated | deleted | reordered | signed-in
    entity: { type: String, required: true, index: true }, // posts | pages | nav | categories …
    entityId: { type: String, default: '' },
    label: { type: String, default: '' },
    summary: { type: String, default: '' },
    fields: { type: [String], default: [] },

    // How
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    status: { type: Number, default: 200 },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// Newest first is the only reading order; a year of history is plenty, so older
// rows expire on their own and the collection never grows without bound.
auditLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

auditLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('AuditLog', auditLogSchema);
