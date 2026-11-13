import User from './models/User.js';
import NavLink from './models/NavLink.js';
import Page from './models/Page.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Ministry from './models/Ministry.js';
import Activity from './models/Activity.js';
import GivingOption from './models/GivingOption.js';
import SiteSettings from './models/SiteSettings.js';
import UpdateCategory, { DEFAULT_CATEGORY_NAMES } from './models/UpdateCategory.js';
import { toSlug } from './utils/slug.js';

const img = (name) => `/images/${name}.png`;

const SETTINGS = {
  key: 'site',
  siteName: 'Calvary Chapel Iloilo',
  shortName: 'CCI',
  tagline: 'A Bible-believing church in the heart of Iloilo',
  heroKicker: 'A Bible-believing fellowship · Iloilo City',
  heroLines: [
    { label: 'Evangelism', text: 'Showing the way' },
    { label: 'Discipleship', text: 'Teaching the truth' },
    { label: 'Mission', text: 'Living the life' },
  ],
  heroSubtitle: 'Come as you are. Leave changed by the Word of God.',
  heroButtons: [
    { label: 'Join our church', href: '/pages/about', style: 'solid' },
    { label: 'Contact us', href: '/contact', style: 'outline' },
  ],
  background: {
    type: 'image',
    url: img('hero-mountains'),
    poster: '',
    overlay: 52,
    blur: 0,
    focal: 'center',
  },
  verse: {
    text: '“Your word is a lamp to my feet and a light to my path.”',
    reference: 'Psalm 119:105',
  },
  serviceTimes: [
    { day: 'Sunday', time: '9:00 AM', label: 'Sunday Service · 3rd Floor, Robinsons Pavia' },
    { day: 'Tuesday', time: '6:30 PM', label: "New Believer's Class · LARC" },
    { day: 'Wednesday', time: '6:30 PM', label: 'Book of Isaiah with Ptr. Mark · 3rd Floor, Robinsons Pavia' },
  ],
  contact: {
    address: '3rd Floor, Robinsons Pavia, Iloilo City',
    phone: '',
    email: 'hello@calvarychapeliloilo.org',
    people: [],
    mapUrl: '',
  },
  socials: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  },
  announcements: [
    {
      text: 'Sunday Service · 9:00 AM · 3rd Floor, Robinsons Pavia',
      href: '/activities',
      active: true,
    },
  ],
  footerNote: 'Grace and peace to you.',
  theme: { defaultMode: 'system', accent: 'gold' },
};

const NAV = [
  { label: 'Home', href: '/', order: 0 },
  { label: 'About', href: '/pages/about', order: 1 },
  { label: 'Ministries', href: '/ministries', order: 2 },
  { label: 'Activities', href: '/activities', order: 3 },
  { label: 'Updates', href: '/updates', order: 4 },
  {
    label: 'Donate',
    href: '/pages/donate',
    order: 5,
    children: [
      { label: 'Give Online', href: '/pages/donate#give', order: 0 },
      { label: 'Ministry Support', href: '/pages/donate#ministry-support', order: 1 },
      { label: 'Building Fund', href: '/pages/donate#building-fund', order: 2 },
    ],
  },
];

const PAGES = [
  {
    slug: 'about',
    title: 'About Calvary Chapel Iloilo',
    subtitle: 'A family of believers walking through Scripture, verse by verse.',
    heroImage: img('worship'),
    content: `## A family rooted in the Word

Calvary Chapel Iloilo is a non-denominational, Bible-believing church in Iloilo City. We are ordinary people from different backgrounds who have found life, forgiveness, and hope in Jesus Christ.

We gather to worship Him, to study the Scriptures verse by verse, and to love one another and our city.

> “They devoted themselves to the apostles’ teaching and the fellowship, to the breaking of bread and the prayers.” — Acts 2:42

## What we believe

- **The Scriptures** — The Bible is the inspired, trustworthy Word of God and our final authority for faith and life (2 Timothy 3:16–17).
- **God** — One God, eternally existing in three persons: Father, Son, and Holy Spirit.
- **Jesus Christ** — Fully God and fully man, who died for our sins, rose again, and is coming back.
- **Salvation** — A gift of grace received through faith in Jesus Christ alone (Ephesians 2:8–9).
- **The Holy Spirit** — He teaches us, empowers us for holy living, and equips every believer to serve.
- **The Church** — Every believer is part of the body of Christ, called to worship, grow, and make disciples.

## Our heartbeat

**Evangelism — showing the way.** We want every person in Iloilo to hear the good news of Jesus.

**Discipleship — teaching the truth.** We grow as we open the Word together, week by week.

**Mission — living the life.** We serve our neighbors with the love we have received.

## What to expect

A warm welcome, heartfelt worship, and a clear, verse-by-verse message from the Bible. Come as you are — there is no dress code and no pressure. If you have questions, we would love to talk with you.`,
    published: true,
  },
  {
    slug: 'donate',
    title: 'Give with a cheerful heart',
    subtitle: 'Your generosity helps carry the gospel and care for people in Iloilo.',
    heroImage: img('outreach'),
    content: `## Every gift tells a story

Every gift — large or small — helps us share the gospel in Iloilo, teach the Word faithfully, and care for people in need. We give because God has first given to us.

> “Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver.” — 2 Corinthians 9:7

## Where your giving goes

Your generosity supports Sunday worship and teaching, discipleship for children and youth, community outreach, and the everyday needs of our church family. We steward every gift with prayer, care, and transparency.

## How to give

Choose an option below. For security, account details are shared through the church office — please [contact us](/contact) and we will guide you personally.`,
    published: true,
  },
];

const MINISTRIES = [
  {
    name: 'Worship & Music',
    slug: 'worship-and-music',
    tagline: 'Songs that lift our eyes to Jesus.',
    description: `Our worship team leads the church in heartfelt, Christ-centered singing each Sunday. We believe worship is more than music — it is a life surrendered to God.

**What we do**
- Lead congregational worship at our Sunday gatherings
- Rehearse weekly and grow together as musicians and servants
- Point every song back to Scripture and the gospel

If you play an instrument or sing and love Jesus, we would be glad to meet you.`,
    image: img('worship'),
    leader: 'Worship Team',
    schedule: 'Rehearsal · Saturday, 4:00 PM',
    order: 1,
    published: true,
  },
  {
    name: "Children's Ministry",
    slug: 'childrens-ministry',
    tagline: 'Planting seeds of truth in young hearts.',
    description: `Children are a gift from the Lord. Each Sunday our teachers welcome kids into a safe, joyful space where the Bible is taught simply and clearly.

**A typical Sunday**
- Age-appropriate Bible lessons
- Songs, crafts, and memory verses
- Caring volunteers who know your child by name

We partner with parents because faith is caught at home as much as it is taught.`,
    image: img('bible-study'),
    leader: 'Children’s Ministry Team',
    schedule: 'Sundays · 9:00 AM',
    order: 2,
    published: true,
  },
  {
    name: 'Youth Fellowship',
    slug: 'youth-fellowship',
    tagline: 'A generation anchored in Christ.',
    description: `Our youth ministry is a place for students to ask honest questions, build real friendships, and discover what it means to follow Jesus in everyday life.

**We gather for**
- Bible study and discussion
- Worship, games, and retreats
- Service projects around Iloilo

Whoever you are and wherever you come from, there is a seat for you.`,
    image: img('outreach'),
    leader: 'Youth Leaders',
    schedule: 'Fridays · 6:00 PM',
    order: 3,
    published: true,
  },
  {
    name: 'Bible Study & Discipleship',
    slug: 'bible-study-and-discipleship',
    tagline: 'Growing in grace, verse by verse.',
    description: `We believe discipleship happens when people open the Word together and walk through life side by side.

**Midweek study**
Our Wednesday gathering works through a book of the Bible verse by verse, with time for questions and prayer. Small groups meet throughout the week to apply what we learn.

Come with your Bible, a notebook, and a hungry heart.`,
    image: img('bible-study'),
    leader: 'Pastor Jeric Mark',
    schedule: 'Wednesdays · 6:30 PM',
    order: 4,
    published: true,
  },
  {
    name: 'Community Outreach',
    slug: 'community-outreach',
    tagline: 'Faith that moves beyond the walls.',
    description: `We want the love of Jesus to be visible in our city. Through food distribution, visits, and practical help, we serve our neighbors with no strings attached.

> “Religion that is pure and undefiled before God the Father is this: to visit orphans and widows in their affliction...” — James 1:27

**Ways to serve**
- Pack and distribute food assistance
- Join home visits and prayer teams
- Help with community events

Every Saturday is an opportunity to be the hands and feet of Jesus.`,
    image: img('outreach'),
    leader: 'Outreach Team',
    schedule: 'Saturdays · 8:00 AM',
    order: 5,
    published: true,
  },
  {
    name: 'Prayer Ministry',
    slug: 'prayer-ministry',
    tagline: 'Standing together before the throne of grace.',
    description: `Prayer is the heartbeat of everything we do. Our prayer team intercedes for the church, the city of Iloilo, and the nations.

**Join us**
- Wednesday prayer gathering before Bible study
- Prayer requests handled with care and confidentiality
- Early-morning prayer every first Saturday

> “Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.” — Philippians 4:6

You are welcome to send us a prayer request — we would count it a privilege to pray with you.`,
    image: img('worship'),
    leader: 'Prayer Team',
    schedule: 'Wednesdays · 5:30 PM',
    order: 6,
    published: true,
  },
];

function nextDay(dayIndex, hour, minute = 0) {
  const now = new Date();
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  let diff = (dayIndex - date.getDay() + 7) % 7;
  if (diff === 0 && date <= now) diff = 7;
  date.setDate(date.getDate() + diff);
  return date;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function buildActivities() {
  return [
    {
      title: 'Sunday Worship Gathering',
      slug: 'sunday-worship-gathering',
      description: `Come worship the Lord with us this Sunday. We open the Scriptures verse by verse and share in the Lord's Supper together.\n\n**9:00 AM** — Morning worship · **4:00 PM** — Afternoon worship.`,
      image: img('worship'),
      category: 'Worship',
      location: 'Calvary Chapel Iloilo',
      startAt: nextDay(0, 9, 0),
      endAt: nextDay(0, 10, 30),
      published: true,
    },
    {
      title: 'Midweek Bible Study: Romans',
      slug: 'midweek-bible-study-romans',
      description: `We continue our verse-by-verse study through the book of Romans. This week we look at Romans 3:21–31 and the righteousness that comes through faith in Jesus Christ.\n\nBring your Bible and a notebook. Coffee is ready.`,
      image: img('bible-study'),
      category: 'Bible Study',
      location: 'Fellowship Hall',
      startAt: nextDay(3, 18, 30),
      endAt: nextDay(3, 20, 0),
      published: true,
    },
    {
      title: 'Youth Night: Anchored',
      slug: 'youth-night-anchored',
      description: `A night of worship, honest conversation, and games for students. We are looking at what it means to be anchored in Christ when life feels uncertain.\n\nInvite a friend — snacks are on us.`,
      image: img('outreach'),
      category: 'Youth',
      location: 'Youth Room',
      startAt: nextDay(5, 18, 0),
      endAt: nextDay(5, 20, 30),
      published: true,
    },
    {
      title: 'Community Outreach: Bless a Family',
      slug: 'community-outreach-bless-a-family',
      description: `Join us as we pack and deliver food assistance to neighboring families. We will pray together, go out in teams, and share the love of Jesus in practical ways.\n\nMeet at the church at 7:30 AM. Wear comfortable clothes.`,
      image: img('outreach'),
      category: 'Outreach',
      location: 'Meet at the church',
      startAt: nextDay(6, 8, 0),
      endAt: nextDay(6, 12, 0),
      published: true,
    },
  ];
}

const POSTS = [
  {
    title: 'Welcome home, Iloilo',
    content: `We are delighted to welcome you to the new online home of **Calvary Chapel Iloilo**.

Whether you are exploring faith for the first time or have walked with Jesus for many years, there is a place for you here. We gather simply to worship God, open His Word, and encourage one another.

**Sunday gatherings**
- 9:00 AM — Worship Service
- 4:00 PM — Afternoon Service

**Midweek**
Wednesday, 6:30 PM — Prayer & Bible Study

> “Let the word of Christ dwell in you richly...” — Colossians 3:16

Come as you are. You will find a warm welcome, clear teaching from the Bible, and a family learning to follow Jesus together.`,
    category: 'Announcement',
    coverImage: img('worship'),
    pinned: true,
    published: true,
    ageDays: 2,
  },
  {
    title: 'Romans: the righteousness of God',
    content: `This Wednesday we continue our journey through **Romans**, verse by verse.

Paul writes in Romans 1:16 that the gospel “is the power of God for salvation to everyone who believes.” That power is not in our performance — it is in the finished work of Jesus Christ.

**This week: Romans 3:21–31**
- The righteousness God gives, not the righteousness we earn
- Why faith, not works, is the only ground of our standing before God
- How grace changes the way we live

Bring your Bible, a notebook, and a friend. If you cannot join us in person, send us a message and we will pray with you.`,
    category: 'Sermon',
    coverImage: img('bible-study'),
    pinned: false,
    published: true,
    ageDays: 5,
  },
  {
    title: 'Serving our neighbors, one family at a time',
    content: `On Saturday morning, volunteers from Calvary Chapel Iloilo packed and delivered food assistance to families in our community.

It was a simple morning — rice, canned goods, conversation, and prayer. But the Lord reminded us that small acts of obedience carry eternal weight.

> “Religion that is pure and undefiled before God the Father is this: to visit orphans and widows in their affliction...” — James 1:27

Thank you to everyone who gave, packed, carried, and prayed. If you would like to serve with us next time, [contact the church](/contact) — there is room for you.`,
    category: 'Outreach',
    coverImage: img('outreach'),
    pinned: false,
    published: true,
    ageDays: 9,
  },
  {
    title: 'A word for the weary heart',
    content: `Some seasons feel heavy. The bills pile up, the news wears us down, and we wonder if anyone sees.

Jesus speaks into that weariness with extraordinary tenderness:

> “Come to me, all who labor and are heavy laden, and I will give you rest.” — Matthew 11:28

Notice that He does not say “come when you have fixed yourself.” He says **come**. Bring your exhaustion. Bring your questions. Bring your need.

If you are carrying a burden today, we would love to pray with you. Join us Wednesday at 5:30 PM for prayer, or send us a message through the contact page. You are not alone.`,
    category: 'Testimony',
    coverImage: img('hero-mountains'),
    pinned: false,
    published: true,
    ageDays: 14,
  },
];

const GIVING = [
  {
    title: 'General Fund',
    anchor: 'general-fund',
    method: 'gcash',
    description: 'Supports the day-to-day ministry of the church — worship, teaching, discipleship, and care for our church family.',
    accountName: 'Calvary Chapel Iloilo',
    accountNumber: 'Contact the church office',
    instructions: `**GCash**
Send your gift through GCash and include your name and the word “Offering” in the notes.

**In person**
You may also give during our Sunday gatherings. For account details and confirmation, please [contact the church office](/contact) — we will be glad to assist you.`,
    order: 1,
    published: true,
  },
  {
    title: 'Ministry Support',
    anchor: 'ministry-support',
    method: 'bank',
    description: 'Direct your gift toward children’s ministry, youth discipleship, worship, or community outreach.',
    accountName: 'Calvary Chapel Iloilo',
    accountNumber: 'Contact the church office',
    instructions: `**Bank transfer**
Contact the church office for the ministry designation and account details. Please include the ministry you wish to support in the memo.

**By arrangement**
You can also speak with a ministry leader after the Sunday service to designate your gift.`,
    order: 2,
    published: true,
  },
  {
    title: 'Building Fund',
    anchor: 'building-fund',
    method: 'bank',
    description: 'Helps provide a permanent home for worship, Bible study, and community ministry in Iloilo.',
    accountName: 'Calvary Chapel Iloilo',
    accountNumber: 'Contact the church office',
    instructions: `**Give toward the building fund**
Contact the church office for details and to designate your gift to the building fund.

We are grateful for every prayerful pledge and gift. “Unless the Lord builds the house, those who build it labor in vain.” — Psalm 127:1`,
    order: 3,
    published: true,
  },
];

async function ensureUsers() {
  const seeds = [
    {
      name: process.env.SUPERADMIN_NAME || 'Superadmin',
      email: (process.env.SUPERADMIN_EMAIL || 'superadmin@calvarychapeliloilo.org').toLowerCase(),
      password: process.env.SUPERADMIN_PASSWORD,
      role: 'superadmin',
      passwordEnv: 'SUPERADMIN_PASSWORD',
    },
    {
      name: process.env.ADMIN_NAME || 'Church Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@calvarychapeliloilo.org').toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      passwordEnv: 'ADMIN_PASSWORD',
    },
  ];

  const users = [];
  for (const seed of seeds) {
    let user = await User.findOne({ email: seed.email });
    if (!user) {
      if (!seed.password) {
        throw new Error(`Set ${seed.passwordEnv} in the environment before seeding the ${seed.role} account.`);
      }
      const { passwordEnv, ...account } = seed;
      user = await User.create(account);
      console.log(`[seed] Created ${seed.role}: ${seed.email}`);
    }
    users.push(user);
  }
  return users;
}

export async function seedDatabase({ reset = false } = {}) {
  if (reset) {
    console.log('[seed] Resetting seeded content (accounts are kept)...');
    await Promise.all([
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Page.deleteMany({}),
      Ministry.deleteMany({}),
      Activity.deleteMany({}),
      GivingOption.deleteMany({}),
      NavLink.deleteMany({}),
      SiteSettings.deleteMany({}),
      UpdateCategory.deleteMany({}),
    ]);
  }

  const [superadmin] = await ensureUsers();

  if (!(await SiteSettings.exists({ key: 'site' }))) {
    await SiteSettings.create(SETTINGS);
    console.log('[seed] Site settings created.');
  }

  if ((await NavLink.countDocuments()) === 0) {
    for (const item of NAV) {
      const parent = await NavLink.create({
        label: item.label,
        href: item.href,
        order: item.order,
        visible: true,
      });
      for (const child of item.children || []) {
        await NavLink.create({
          label: child.label,
          href: child.href,
          parent: parent._id,
          order: child.order,
          visible: true,
        });
      }
    }
    console.log('[seed] Navigation created.');
  }

  if ((await Page.countDocuments()) === 0) {
    await Page.create(PAGES.map((page) => ({ ...page, updatedBy: superadmin._id })));
    console.log('[seed] Pages created.');
  }

  if ((await Ministry.countDocuments()) === 0) {
    await Ministry.create(MINISTRIES);
    console.log('[seed] Ministries created.');
  }

  if ((await Activity.countDocuments()) === 0) {
    await Activity.create(buildActivities());
    console.log('[seed] Activities created.');
  }

  if ((await GivingOption.countDocuments()) === 0) {
    await GivingOption.create(GIVING);
    console.log('[seed] Giving options created.');
  }

  if ((await UpdateCategory.countDocuments()) === 0) {
    await UpdateCategory.create(
      DEFAULT_CATEGORY_NAMES.map((name, index) => ({
        name,
        slug: toSlug(name, `category-${index}`),
        order: index,
        visible: true,
      }))
    );
    console.log('[seed] Update categories created.');
  }

  if ((await Post.countDocuments()) === 0) {
    for (const item of POSTS) {
      const { ageDays, ...post } = item;
      const created = await Post.create({
        ...post,
        author: superadmin._id,
        authorName: superadmin.name,
      });
      if (ageDays) {
        await Post.updateOne({ _id: created._id }, { $set: { createdAt: daysAgo(ageDays) } });
      }
    }
    console.log('[seed] Updates created.');
  }

  return { ok: true, reset };
}

export const ensureSeeded = () => seedDatabase({ reset: false });
