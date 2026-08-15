import { createClient } from 'redis';
import 'dotenv/config';

export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on('error', (err) => console.error('Redis client error', err));

// Call this once from your server startup, not on every import
export async function connectRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}