import { transit_realtime } from "gtfs-realtime-bindings";
import fetch from "node-fetch";
import { realtimeKey, redisClient } from "./redis";
import dotenv from "dotenv";
dotenv.config();

export interface StopTimeUpdate {
  key: string;
  cancelled?: boolean;
  delayArrival?: number | null;
  delayDeparture?: number | null;
}

async function getLastModifiedHeader(): Promise<string | null> {
  const result = await redisClient.get("lastModifiedHeader");
  return result;
}

async function setLastModifiedHeader(header: string) {
  await redisClient.set("lastModifiedHeader", header);
}

async function fetchFeed(): Promise<transit_realtime.FeedMessage> {
  const url = "https://gtfs.ovapi.nl/nl/tripUpdates.pb";
  const headers: Record<string, string> = {};
  headers["User-Agent"] = process.env.USER_AGENT || "";
  const lastModifiedHeader = await getLastModifiedHeader();
  if (lastModifiedHeader) {
    headers["If-Modified-Since"] = lastModifiedHeader;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const lastModified = response.headers.get("Last-Modified");
  if (!lastModified) {
    throw new Error("No Last-Modified header in response");
  }

  await setLastModifiedHeader(lastModified);
  const buffer = await response.arrayBuffer();
  const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
  return feed;
}

async function storeFeedInRedis(feed: transit_realtime.FeedMessage) {
  const result: StopTimeUpdate[] = [];
  feed.entity.forEach((entity) => {
    if (entity.tripUpdate) {
      const tripUpdate = entity.tripUpdate;
      const date = tripUpdate.trip.startDate;
      const tripId = tripUpdate.trip.tripId;
      if (!date || !tripId) {
        console.log(
          "[RTUPDATE] Skipping tripUpdate due to missing data",
          tripUpdate
        );
        return;
      }
      entity.tripUpdate.stopTimeUpdate?.forEach((stopTimeUpdate) => {
        const stopId = stopTimeUpdate.stopId;
        const cancelled = stopTimeUpdate.scheduleRelationship === 1;
        const delayArrival = stopTimeUpdate.arrival?.delay;
        const delayDeparture = stopTimeUpdate.departure?.delay;
        if (!stopId) {
          if (tripUpdate.trip.scheduleRelationship === 3) return; // TODO: What to do with this?
          console.log(
            "[RTUPDATE] Skipping stopTimeUpdate due to missing stopId",
            stopTimeUpdate
          );
          return;
        }
        const key = realtimeKey(date, stopId, tripId);
        result.push({
          key,
          cancelled,
          delayArrival,
          delayDeparture,
        });
      });
    } else {
      console.log("[RTUPDATE] TODO: no tripUpdate", entity);
    }
  });

  // Filter out entries with no delay and not cancelled
  const filtered = result.filter(
    (item) =>
      item.cancelled || item.delayArrival !== 0 || item.delayDeparture !== 0
  );

  // Store in Redis with pipeline
  const pipeline = redisClient.multi();
  filtered.forEach((item) => {
    pipeline.setEx(
      item.key,
      300,
      JSON.stringify({
        cancelled: item.cancelled,
        delayArrival: item.delayArrival,
        delayDeparture: item.delayDeparture,
      })
    );
  });
  await pipeline.exec();
}

export async function sync() {
  try {
    console.log("[RTUPDATE] Starting GTFS-RT sync...");
    const feed = await fetchFeed();
    await storeFeedInRedis(feed);
    console.log("[RTUPDATE] Feed stored in Redis successfully.");
  } catch (error) {
    console.error("[RTUPDATE] Error:", error);
  }
}

// StopTimeUpdate {
//  stopSequence: 7,
//  arrival: StopTimeEvent { delay: 0, time: [Long] },
//  departure: StopTimeEvent { delay: 0, time: [Long] },
//  stopId: '3153072',
//  scheduleRelationship: 0
// }
