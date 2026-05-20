import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {

  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };

if (!global._mongoose) {
  global._mongoose = cached;
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "Defina MONGODB_URI no ambiente. Exemplo: mongodb+srv://user:pass@cluster.mongodb.net/keumotos"
    );
  }

  if (!cached.promise) {
    // Tuning pra Vercel serverless (Fluid Compute reusa instâncias):
    // - maxPoolSize 5: cada warm instance segura até 5 conexões. Atlas
    //   M0 free tier limita 500 conexões totais; com 100 warm instances
    //   simultâneas (cold spread), 5×100 = 500 — no limite. M10 sobe.
    // - serverSelectionTimeoutMS 10s: falha rápido se Atlas indisponível
    //   em vez de pendurar 30s (default).
    // - socketTimeoutMS 45s: queries pesadas (aggregates) terminam.
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
