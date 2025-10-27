export interface StopTimeApi {
  stopId: string;
  tripId: number;
  headSign: String | null;
  routeShortName: String | null;
  routeLongName: String | null;
  arrivalTime: String;
  departureTime: String;
  calculatedArrivalTime: String;
  minutesUntil: number;
  delayInSeconds: number;
  cancelled: Boolean;
}
