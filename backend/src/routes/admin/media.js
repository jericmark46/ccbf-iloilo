import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import Media from '../../models/Media.js';
import { asyncHandler, assert, str, parsePagination } from '../../utils/http.js';
import { detectVideoProvider } from '../../utils/videoProviders.js';
import { upload, uploadDir } from '../../middleware/upload.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 24 });
    const filter = {};
    if (req.query.type === 'image' || req.query.type === 'video') filter.type = req.query.type;

    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Media.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    assert(req.file, 400, 'Please choose a file to upload.');

    const media = await Media.create({
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mime: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    res.status(201).json({ media });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const url = str(req.body.url, 800);
    const isSafe = /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
    assert(isSafe, 400, 'Please enter a valid image or video URL.');

    const media = await Media.create({
      url,
      type: detectVideoProvider(url) ? 'video' : req.body.type === 'video' ? 'video' : 'image',
      originalName: str(req.body.originalName, 200) || 'Linked media',
      uploadedBy: req.user._id,
    });

    res.status(201).json({ media });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const media = await Media.findById(req.params.id);
    assert(media, 404, 'That media item could not be found.');

    if (media.filename) {
      const target = path.join(uploadDir, path.basename(media.filename));
      if (target.startsWith(uploadDir) && fs.existsSync(target)) {
        fs.rmSync(target, { force: true });
      }
    }
    await media.deleteOne();
    res.json({ ok: true });
  })
);

export default router;
