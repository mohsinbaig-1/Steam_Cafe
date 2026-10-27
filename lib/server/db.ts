import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __steamCafeMongoose?: MongooseCache;
};

const cached = globalWithMongoose.__steamCafeMongoose ?? {
  connection: null,
  promise: null
};

globalWithMongoose.__steamCafeMongoose = cached;

export async function connectToDatabase() {
  if (cached.connection) return cached.connection;

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI must be configured for the REST API.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri, {
      dbName: process.env.MONGODB_DB_NAME ?? "steam_cafe"
    });
  }

  try {
    cached.connection = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.connection;
}
