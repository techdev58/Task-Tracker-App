import mongoose from "mongoose";
import dns from "dns";

// `mongodb+srv://` URIs require raw SRV/TXT DNS lookups. Some Windows setups
// (VPN clients, security software) point Node's resolver at a local stub that
// refuses those queries even though normal hostname resolution works fine.
// Falling back to public resolvers avoids connection failures in that case.
if (process.env.MONGODB_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
}

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
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
