import app, { ensureReady } from './app.js';
import { disconnectDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    const connection = await ensureReady();

    const server = app.listen(PORT, () => {
      console.log(`\n  Calvary Chapel Iloilo API`);
      console.log(`  ─────────────────────────`);
      console.log(`  Local:   http://localhost:${PORT}`);
      console.log(`  Health:  http://localhost:${PORT}/api/health`);
      console.log(`  DB mode: ${connection.mode}\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDB(connection.server).catch(() => {});
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    // Don't exit here: Vercel invokes the exported app directly and each request retries the DB.
    console.error('[server] Failed to start:', error);
  }
}

// On Vercel the exported app is invoked directly, so skip the local listener.
if (!process.env.VERCEL) start();

export default app;
