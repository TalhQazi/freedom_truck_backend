import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongodInstance: any = null;

export const connectDB = async (): Promise<string> => {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    try {
      console.log(`[DB] Attempting connection to configured MONGODB_URI...`);
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Successfully connected to MongoDB at ${primaryUri}`);
      return primaryUri;
    } catch (err: any) {
      console.warn(`[DB] Failed to connect to ${primaryUri}: ${err.message}`);
      console.log(`[DB] Falling back to embedded MongoMemoryServer for reliable standalone execution...`);
    }
  }

  // Try localhost standard MongoDB first with a short timeout
  try {
    const localUri = 'mongodb://127.0.0.1:27017/freedom_car_truck';
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[DB] Connected to local MongoDB instance: ${localUri}`);
    return localUri;
  } catch {
    // Start MongoMemoryServer fallback
    console.log(`[DB] Starting embedded MongoDB server...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[DB] Successfully connected to embedded MongoDB instance: ${uri}`);
    return uri;
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
