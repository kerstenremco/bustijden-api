import { createClient } from "redis";
import { BusStopTime, StopTimeUpdate } from "./types";
import dotenv from "dotenv";
dotenv.config();

export const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

function cacheKey(date: string, stopId: string): string {
  return `C#${date}#${stopId}`;
}

export function realtimeKey(date: string, stopId: string, tripId: string | number): string {
  return `RT#${date}#${stopId}#${tripId}`;
}

export async function getEntryFromRedis(date: string, stopId: string): Promise<Object> {
  const key = `${date}-${stopId}`;

  const value = await redisClient.get(key);
  return JSON.parse(value || "{}");
}

export async function getCachedStop(date: string, stopId: string): Promise<BusStopTime[] | null> {
  const key = cacheKey(date, stopId);

  const value = await redisClient.get(key);
  if (!value) return null;
  return JSON.parse(value);
}

export async function setCachedStop(date: string, stopId: string, data: BusStopTime[]) {
  const key = cacheKey(date, stopId);
  await redisClient.setEx(key, 60 * 60 * 2, JSON.stringify(data));
}

export async function getDelayByStopAndTrip(date: string, stopId: string, tripId: number): Promise<StopTimeUpdate | null> {
  const key = realtimeKey(date, stopId, tripId);
  const data = await redisClient.get(key);
  if (!data) return null;
  const { cancelled, delay } = JSON.parse(data);
  return { cancelled, delay };
}
