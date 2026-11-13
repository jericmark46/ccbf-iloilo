import './src/config/env.js';
import app, { ensureReady } from './src/application.js';

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});

ensureReady().catch((error) => {
  console.error('[server] Database not ready at boot; requests will retry:', error.message);
});
