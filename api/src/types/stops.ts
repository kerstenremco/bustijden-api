export interface BusStopTime {
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_headsign: string | null;
  trip: {
    trip_id: number;
    trip_headsign: string | null;
    route: {
      route_short_name: string | null;
      route_long_name: string | null;
    };
  };
  stop: {
    stop_name: string | null;
  };
}

export interface BusStopTimeWithRealTime {
  stopId: string;
  arrivalTime: string;
  departureTime: string;
  stopHeadsign: string | null;
  tripId: number;
  tripHeadsign: string | null;
  routeShortName: string | null;
  routeLongName: string | null;
  stopName: string | null;
  minutesUntil: number;
  delayInSeconds: number;
  cancelled: boolean;
  calculatedArrivalTime: string;
}

export interface StopByName {
  name: string;
  baseKey: string;
  stops: string[];
}

export interface StopTimeUpdate {
  cancelled: boolean;
  delay: number;
}
