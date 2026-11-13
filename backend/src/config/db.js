import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), '.data', 'db');

async function startEmbeddedMongo() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dataDir, { recursive: true });

  const create = () =>
    MongoMemoryServer.create({
      binary: { version: process.env.MEMORY_DB_VERSION || '4.4.29' },
      instance: {
        dbPath: dataDir,
        storageEngine: 'wiredTiger',
        dbName: process.env.MONGODB_DB_NAME || 'calvary_chapel',
        port: 27018,
      },
    });

  try {
    return await create();
  } catch (error) {
    // A previous dev process may have exited without releasing MongoDB's lock.
    if (String(error.message).toLowerCase().includes('lock')) {
      const lock = path.join(dataDir, 'mongod.lock');
      if (fs.existsSync(lock)) fs.rmSync(lock, { force: true });
      return create();
    }
    throw error;
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB_NAME || 'calvary_chapel';

  if (uri) {
    try {
      await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 9000 });
      console.log(`[db] Connected to configured MongoDB (${dbName})`);
      return { mode: 'mongo' };
    } catch (error) {
      console.warn(`[db] Configured MongoDB unreachable: ${error.message}`);
      const allowFallback =
        process.env.NODE_ENV !== 'production' && process.env.USE_MEMORY_DB !== 'false';
      if (!allowFallback) throw error;
    }
  }

  console.log('[db] Starting embedded MongoDB (persistent dev database)...');
  const server = await startEmbeddedMongo();
  await mongoose.connect(server.getUri(dbName), { dbName, serverSelectionTimeoutMS: 20000 });
  console.log(`[db] Embedded MongoDB ready at ${server.getUri(dbName)}`);
  return { mode: 'memory', server };
}

export async function disconnectDB(embedded) {
  await mongoose.disconnect();
  if (embedded) await embedded.stop();
}
