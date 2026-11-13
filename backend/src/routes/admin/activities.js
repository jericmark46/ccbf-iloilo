import { Router } from 'express';
import Activity from '../../models/Activity.js';
import { asyncHandler, assert, str, bool } from '../../utils/http.js';
import { toSlug, uniqueSlug } from '../../utils/slug.js';
import { cleanRichText } from '../../utils/richText.js';

const router = Router();

const validDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const activities = await Activity.find().sort({ startAt: -1 });
    res.json({ activities });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = str(req.body.title, 160);
    const startAt = validDate(req.body.startAt);
    assert(title.length >= 2, 400, 'Please enter the activity title.');
    assert(startAt, 400, 'Please choose a valid start date and time.');

    const activity = await Activity.create({
      title,
      slug: await uniqueSlug(Activity, req.body.slug || toSlug(title)),
      description: cleanRichText(req.body.description, 20000),
      image: str(req.body.image, 600),
      category: str(req.body.category, 60) || 'Gathering',
      location: str(req.body.location, 200),
      startAt,
      endAt: validDate(req.body.endAt) || undefined,
      published: bool(req.body.published, true),
    });

    res.status(201).json({ activity });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const activity = await Activity.findById(req.params.id);
    assert(activity, 404, 'That activity could not be found.');

    if (req.body.title !== undefined) {
      const title = str(req.body.title, 160);
      assert(title.length >= 2, 400, 'Please enter the activity title.');
      activity.title = title;
    }
    if (req.body.slug !== undefined) {
      activity.slug = await uniqueSlug(Activity, req.body.slug || activity.title, activity._id);
    }
    if (req.body.description !== undefined) activity.description = cleanRichText(req.body.description, 20000);
    if (req.body.image !== undefined) activity.image = str(req.body.image, 600);
    if (req.body.category !== undefined) activity.category = str(req.body.category, 60) || 'Gathering';
    if (req.body.location !== undefined) activity.location = str(req.body.location, 200);
    if (req.body.startAt !== undefined) {
      const startAt = validDate(req.body.startAt);
      assert(startAt, 400, 'Please choose a valid start date and time.');
      activity.startAt = startAt;
    }
    if (req.body.endAt !== undefined) activity.endAt = validDate(req.body.endAt) || undefined;
    if (req.body.published !== undefined) activity.published = bool(req.body.published, true);

    await activity.save();
    res.json({ activity });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    assert(activity, 404, 'That activity could not be found.');
    res.json({ ok: true });
  })
);

export default router;
