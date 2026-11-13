import './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { seedDatabase } from './seedData.js';

const reset = process.argv.includes('--reset');
let embedded;

try {
  const connection = await connectDB();
  embedded = connection.server;
  await seedDatabase({ reset });
  console.log('[seed] Database is ready.');
} catch (error) {
  console.error('[seed] Failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDB(embedded).catch(() => {});
  process.exit(process.exitCode || 0);
}
