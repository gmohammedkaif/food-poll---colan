import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  let uri = env.MONGODB_URI;

  if (!uri) {
    console.log('[DB] No MONGODB_URI provided. Initializing embedded real MongoDB engine (mongodb-memory-server)...');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'pollhub'
      }
    });
    uri = mongoMemoryServer.getUri();
    console.log(`[DB] Embedded MongoDB instance started at: ${uri}`);
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true
    });
    console.log(`[DB] Successfully connected to MongoDB at ${uri.includes('localhost') || uri.includes('127.0.0.1') ? 'local instance' : 'remote cluster'}`);
  } catch (error) {
    console.error('[DB] Failed to connect to primary MongoDB URI:', error);
    if (!mongoMemoryServer) {
      console.log('[DB] Falling back to embedded MongoDB engine...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'pollhub' }
      });
      const fallbackUri = mongoMemoryServer.getUri();
      await mongoose.connect(fallbackUri, { autoIndex: true });
      console.log(`[DB] Embedded MongoDB fallback connected at: ${fallbackUri}`);
    } else {
      throw error;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
  console.log('[DB] Disconnected from MongoDB');
}
