import mongoose from "mongoose"
import { env } from "./env.js"

const cache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  ((globalThis as any).__mongoose ??= { conn: null, promise: null })

export async function connectDB() {
  if (cache.conn) return cache.conn

  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  })

  try {
    cache.conn = await cache.promise
    console.log("MongoDB conectado")
  } catch (e) {
    cache.promise = null
    throw e
  }
  return cache.conn
}