import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

let memoryServer = null;

/**
 * Connect to MongoDB. Falls back to an in-memory MongoDB instance when a real
 * server is unavailable (useful for demos / evaluation without infra setup).
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 12000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB → ${maskUri(env.mongoUri)}`);
    return mongoose.connection;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[db] Primary MongoDB unavailable (${err.message}).`);
    return tryMemoryServer();
  }
}

async function tryMemoryServer() {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log('[db] Connected to in-memory MongoDB (data is ephemeral).');
    return mongoose.connection;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[db] Could not start in-memory MongoDB. Install MongoDB locally or set MONGODB_URI.',
      err.message,
    );
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

function maskUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}
