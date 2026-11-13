import express from 'express';

const app = express();

app.use(async (_req, res) => {
  const results = {};
  const test = async (name, loader) => {
    try {
      await loader();
      results[name] = 'ok';
    } catch (error) {
      results[name] = `${error?.code || 'ERR'} ${error?.message}`;
    }
  };

  await test('sanitize-html', () => import('sanitize-html'));
  await test('express-rate-limit', () => import('express-rate-limit'));
  await test('multer', () => import('multer'));
  await test('slugify', () => import('slugify'));
  await test('bcryptjs', () => import('bcryptjs'));
  await test('jsonwebtoken', () => import('jsonwebtoken'));
  await test('mongoose', () => import('mongoose'));

  res.json({ node: process.version, results });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
