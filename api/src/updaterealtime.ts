import { transit_realtime } from "gtfs-realtime-bindings";
import fetch from "node-fetch";
import { realtimeKey, redisClient } from "./redis";
import dotenv from "dotenv";
dotenv.config();
import { StopTimeUpdate } from "./types";
import { logMessage, LogSource, LogType } from "./helpers/logger";
import { realTimeUpdateCounter } from "./helpers/prometheus";

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

async function storeFeedInRedis(feed: transit_realtime.FeedMessage): Promise<void> {
  const result: { key: string; body: StopTimeUpdate }[] = [];

  // Filter out all tripUpdates
  const tripUpdates: transit_realtime.ITripUpdate[] = [];
  feed.entity.forEach((entity) => {
    if (entity.tripUpdate) {
      tripUpdates.push(entity.tripUpdate);
    } else {
      realTimeUpdateCounter.inc({ type: "error_not_a_trip_update" });
    }
  });

  // Loop over
  tripUpdates.forEach((tripUpdate) => {
    const date = tripUpdate.trip.startDate;
    const tripId = tripUpdate.trip.tripId;

    if (!date || !tripId) {
      realTimeUpdateCounter.inc({ type: "error_no_date_or_trip_id" });
      return;
    }

    tripUpdate.stopTimeUpdate?.forEach((stopTimeUpdate) => {
      const stopId = stopTimeUpdate.stopId;
      if (!stopId) {
        realTimeUpdateCounter.inc({ type: "error_no_stop_id" });
        return;
      }

      const cancelled = stopTimeUpdate.scheduleRelationship === 1;
      // TODO: NO_DATA?
      const scheduled = stopTimeUpdate.scheduleRelationship === 0 || stopTimeUpdate.scheduleRelationship === 2;
      const delayArrival = stopTimeUpdate.arrival?.delay ?? 0;
      const delayDeparture = stopTimeUpdate.arrival?.delay ?? 0;
      const delay = Math.max(delayArrival, delayDeparture);

      if (!cancelled && !scheduled) {
        realTimeUpdateCounter.inc({ type: "error_not_cancelled_not_scheduled" });
        return;
      }
      if (scheduled && !delay) {
        realTimeUpdateCounter.inc({ type: "skipped_because_0_delay" });
        return;
      }
      if (cancelled) {
        realTimeUpdateCounter.inc({ type: "cancelled" });
      } else {
        realTimeUpdateCounter.inc({ type: "delayed" });
      }
      result.push({
        key: realtimeKey(date, stopId, tripId),
        body: { cancelled, delay },
      });
    });
  });

  // Store in Redis with pipeline
  const pipeline = redisClient.multi();
  result.forEach((item) => {
    pipeline.setEx(item.key, 300, JSON.stringify(item.body));
  });
  await pipeline.exec();
}

export async function sync() {
  try {
    logMessage(LogType.INFO, LogSource.REALTIMESYNC, "Starting GTFS-RT sync...");
    const feed = await fetchFeed();
    await storeFeedInRedis(feed);
    logMessage(LogType.INFO, LogSource.REALTIMESYNC, "GTFS-RT sync done!");
  } catch (error) {
    let errorMessage = "Unknow error while syncing";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    logMessage(LogType.ERROR, LogSource.REALTIMESYNC, errorMessage);
  }
}
