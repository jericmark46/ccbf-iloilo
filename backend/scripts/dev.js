import '../src/config/env.js';
import app, { ensureReady } from '../src/application.js';
import { disconnectDB } from '../src/config/db.js';

const PORT = Number(process.env.PORT) || 5000;
let embeddedServer;

const server = app.listen(PORT, () => {
  console.log(`\n  Calvary Chapel Iloilo API`);
  console.log(`  ─────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Health:  http://localhost:${PORT}/api/health\n`);
});

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectDB(embeddedServer).catch(() => {});
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

try {
  const connection = await ensureReady();
  embeddedServer = connection.server;
  console.log(`  DB mode: ${connection.mode}\n`);
} catch (error) {
  console.error('[server] Database not reachable at startup; requests will retry:', error.message);
}
