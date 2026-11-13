import express from 'express';
import sanitizeHtml from 'sanitize-html';

void sanitizeHtml;

const app = express();

app.use((req, res) => {
  res.json({ ok: true, node: process.version });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
