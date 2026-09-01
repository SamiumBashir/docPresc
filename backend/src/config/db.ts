import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from './env';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  try {
    let uri = ENV.MONGODB_URI;

    // Try connecting to provided MONGODB_URI if specified
    if (uri) {
      try {
        await mongoose.connect(uri);
        console.log(`[Database] Connected to external MongoDB: ${uri}`);
        return uri;
      } catch (err: any) {
        console.warn(`[Database] Failed to connect to MONGODB_URI (${err.message}). Falling back to in-memory MongoDB...`);
      }
    }

    // Try default local mongodb if accessible
    try {
      await mongoose.connect('mongodb://localhost:27017/doctor_prescription', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('[Database] Connected to local MongoDB at mongodb://localhost:27017/doctor_prescription');
      return 'mongodb://localhost:27017/doctor_prescription';
    } catch {
      // Local server not running, start embedded MongoMemoryServer
      console.log('[Database] Starting in-memory MongoDB server for zero-config operation...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          ip: '127.0.0.1',
          dbName: 'doctor_prescription',
        },
      });
      uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory MongoDB instance at ${uri}`);
      return uri;
    }
  } catch (error) {
    console.error('[Database] Connection Error:', error);
    process.exit(1);
  }
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
