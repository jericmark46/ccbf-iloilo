import mongoose from 'mongoose';

const buttonSchema = new mongoose.Schema(
  { label: String, href: String, style: { type: String, enum: ['solid', 'outline', 'ghost'], default: 'solid' } },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site' },

    siteName: { type: String, default: 'Calvary Chapel Iloilo' },
    shortName: { type: String, default: 'CCI' },
    tagline: { type: String, default: 'A Bible-believing family in Iloilo City' },

    heroKicker: { type: String, default: 'Calvary Chapel Iloilo' },
    heroLines: [
      {
        label: String,
        text: String,
        _id: false,
      },
    ],
    heroSubtitle: { type: String, default: '' },
    heroButtons: [buttonSchema],

    background: {
      type: { type: String, enum: ['image', 'video'], default: 'image' },
      url: { type: String, default: '/images/hero-mountains.png' },
      poster: { type: String, default: '' },
      overlay: { type: Number, default: 52, min: 0, max: 90 },
      blur: { type: Number, default: 0, min: 0, max: 12 },
      focal: { type: String, default: 'center' },
    },

    verse: {
      text: { type: String, default: '' },
      reference: { type: String, default: '' },
    },

    serviceTimes: [
      {
        day: String,
        time: String,
        label: String,
        _id: false,
      },
    ],

    contact: {
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      people: [
        {
          name: String,
          role: String,
          email: String,
          phone: String,
          _id: false,
        },
      ],
      mapUrl: { type: String, default: '' },
      mapEmbed: { type: String, default: '' },
      expectTitle: { type: String, default: 'What to expect' },
      expectations: { type: [String], default: [] },
    },

    socials: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      tiktok: { type: String, default: '' },
    },

    announcements: [
      {
        text: String,
        href: String,
        active: { type: Boolean, default: true },
        _id: false,
      },
    ],

    specialAnnouncement: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: '' },
      message: { type: String, default: '' },
      image: { type: String, default: '' },
      version: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },

    footerNote: { type: String, default: '' },
    copy: { type: mongoose.Schema.Types.Mixed, default: {} },
    theme: {
      defaultMode: { type: String, enum: ['light', 'dark', 'system', 'midnight', 'sepia'], default: 'system' },
      accent: { type: String, enum: ['gold', 'ocean', 'forest', 'rose'], default: 'gold' },
    },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

settingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model('SiteSettings', settingsSchema);
