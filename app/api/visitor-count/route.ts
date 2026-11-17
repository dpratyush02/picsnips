import { connection } from "next/server";
import { Redis } from "@upstash/redis";

const baselineVisitors = 29369;
const REDIS_KEY = "picsnips:total_visitors";

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function getVisitorCount(redis: Redis | null): Promise<number> {
  if (!redis) return baselineVisitors;
  try {
    const value = await redis.get<number>(REDIS_KEY);
    if (value === null || value === undefined || Number(value) < baselineVisitors) {
      await redis.set(REDIS_KEY, baselineVisitors);
      return baselineVisitors;
    }
    return Number(value);
  } catch (error) {
    console.warn("Failed to get visitor count from Redis:", error);
    return baselineVisitors;
  }
}

async function incrementVisitorCount(redis: Redis | null): Promise<number> {
  if (!redis) return baselineVisitors;
  try {
    const current = await redis.get<number>(REDIS_KEY);
    if (current === null || current === undefined || Number(current) < baselineVisitors) {
      await redis.set(REDIS_KEY, baselineVisitors + 1);
      return baselineVisitors + 1;
    }
    const next = await redis.incr(REDIS_KEY);
    return Math.max(baselineVisitors, next);
  } catch (error) {
    console.warn("Failed to increment visitor count in Redis:", error);
    return baselineVisitors;
  }
}

export async function GET() {
  await connection();
  const redis = getRedisClient();
  const visitors = await getVisitorCount(redis);

  return Response.json({ visitors }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST() {
  await connection();
  const redis = getRedisClient();
  const visitors = await incrementVisitorCount(redis);

  return Response.json({ visitors }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
