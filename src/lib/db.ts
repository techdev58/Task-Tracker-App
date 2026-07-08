import mongoose from "mongoose";
import "@/lib/models";

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongoose: CachedConnection | undefined;
}

const cached: CachedConnection = global.__mongoose ?? { conn: null, promise: null };
global.__mongoose = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example)."
    );
  }

  if (!cached.promise) {
    // bufferCommands defaults to true: if the connection briefly drops and
    // is reconnecting, Mongoose queues the query and waits rather than
    // throwing immediately.
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
