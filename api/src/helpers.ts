import { PrismaClient } from "@prisma/client";
import { getCachedStop, getDelayByStopAndTrip, setCachedStop } from "./redis";
import { BusStopTime, StopByName, StopTimeApi } from "./types";
import dayjs from "dayjs";
import { todayYyyymmdd, yyyymmddToDayjs, formatTimeStringToHM } from "./helpers/time";
import { stopToBaseKey } from "./helpers/stops";

const prisma = new PrismaClient();

export async function findStops(words: string[]) {
  const stopsQuery = await prisma.stop.findMany({
    where: {
      AND: words.map((word) => ({
        stop_name: {
          contains: word,
          mode: "insensitive",
        },
      })),
    },
    select: { stop_id: true, stop_name: true },
  });

  const result: StopByName[] = [];
  // @ts-ignore
  const unnames: Set<string> = new Set(stopsQuery.map((x) => x.stop_name));
  // filter strings
  const uniqueNames = Array.from(unnames).filter((x) => x !== null && x !== undefined);

  uniqueNames.forEach((name) => {
    const stops = stopsQuery.filter((s) => s.stop_name == name).map((s) => s.stop_id);
    result.push({
      name: name,
      baseKey: stopToBaseKey(name),
      stops,
    });
  });

  return result;
}

export async function getAllStopIds(name: string): Promise<string[]> {
  const stops = await prisma.stop.findMany({
    where: { stop_name: name },
    select: { stop_id: true },
  });
  return stops.map((s) => s.stop_id);
}

export async function getStopTimesAtStop(stopIds: string[], date?: string): Promise<StopTimeApi[]> {
  // init vars
  const dateString: string = date || todayYyyymmdd();

  const serviceIds = await prisma.service.findMany({
    where: {
      date: dateString,
      exception_type: 1,
    },
    select: { service_id: true },
  });
  const ids = serviceIds.map((s) => s.service_id);

  // Find stops in cache
  const cachedStopTimes: BusStopTime[] = [];
  const cachedStops: string[] = [];
  for (const stopId of stopIds) {
    const cached = await getCachedStop(dateString, stopId);
    if (cached) {
      cachedStopTimes.push(...cached);
      cachedStops.push(stopId);
    }
  }

  const uncachedStopIds = stopIds.filter((id) => !cachedStops.some((s) => s === id));

  //Find stops in DB
  const stops: BusStopTime[] = await prisma.stopTime.findMany({
    where: {
      stop_id: { in: uncachedStopIds },
      trip: { service_id: { in: ids }, route: { route_type: 3 } },
    },
    select: {
      stop_id: true,
      arrival_time: true,
      departure_time: true,
      stop_headsign: true,
      trip: {
        select: {
          trip_id: true,
          trip_headsign: true,
          route: {
            select: { route_short_name: true, route_long_name: true },
          },
        },
      },
      stop: { select: { stop_name: true } },
    },
  });

  // Cache uncached stops
  for (const i in uncachedStopIds) {
    const id = uncachedStopIds[i];
    const stopTimesForStop = stops.filter((s) => s.stop_id === id);
    await setCachedStop(dateString, id, stopTimesForStop);
  }

  // merge cached and uncached stops
  const stopsMerged = [...cachedStopTimes, ...stops];

  // Inject RT data and calculate actual arrival time and minutes until
  const result: StopTimeApi[] = [];
  for (const stop of stopsMerged) {
    // Check for real-time data
    const rtime = await getDelayByStopAndTrip(dateString, stop.stop_id, stop.trip.trip_id);
    const delayInSeconds = rtime?.delay ?? 0;
    const cancelled = rtime?.cancelled || false;

    // Calculate actual arrival time
    let [h, min] = stop.arrival_time.split(":").map((x) => parseInt(x));

    let calculatedArrivalTime = yyyymmddToDayjs(dateString)!.set("hour", h).set("minute", min).set("second", 0).add(delayInSeconds, "second");

    // Round
    if (calculatedArrivalTime.second() > 0) {
      calculatedArrivalTime = calculatedArrivalTime.add(1, "minute").set("second", 0);
    }

    // Calculate minutes until
    const minutesUntil = calculatedArrivalTime.diff(dayjs(), "minute");

    // Add to result
    result.push({
      stopId: stop.stop_id,
      tripId: stop.trip.trip_id,
      headSign: stop.stop_headsign ?? stop.trip.trip_headsign,
      routeShortName: stop.trip.route.route_short_name,
      routeLongName: stop.trip.route.route_long_name,
      arrivalTime: formatTimeStringToHM(stop.arrival_time),
      departureTime: formatTimeStringToHM(stop.departure_time),
      calculatedArrivalTime: calculatedArrivalTime.format("HH:mm"),
      minutesUntil,
      delayInSeconds,
      cancelled,
    });
  }

  // Sort by arrival time
  return result
    .filter((r) => r.minutesUntil >= 0)
    .sort((a, b) => {
      return a.minutesUntil - b.minutesUntil;
    });
}
