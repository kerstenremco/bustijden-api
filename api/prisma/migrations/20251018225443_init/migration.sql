-- CreateTable
CREATE TABLE "routes" (
    "route_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "route_short_name" TEXT,
    "route_long_name" TEXT,
    "route_desc" TEXT,
    "route_type" INTEGER NOT NULL,
    "route_color" TEXT,
    "route_text_color" TEXT,
    "route_url" TEXT,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("route_id")
);

-- CreateTable
CREATE TABLE "trips" (
    "route_id" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "realtime_trip_id" TEXT,
    "trip_headsign" TEXT,
    "trip_short_name" TEXT,
    "trip_long_name" TEXT,
    "direction_id" INTEGER,
    "block_id" INTEGER,
    "shape_id" INTEGER,
    "wheelchair_accessible" INTEGER,
    "bikes_allowed" INTEGER,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("trip_id")
);

-- CreateTable
CREATE TABLE "calendar_dates" (
    "service_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "exception_type" INTEGER NOT NULL,

    CONSTRAINT "calendar_dates_pkey" PRIMARY KEY ("service_id","date")
);

-- CreateTable
CREATE TABLE "stop_times" (
    "trip_id" INTEGER NOT NULL,
    "stop_sequence" INTEGER NOT NULL,
    "stop_id" TEXT NOT NULL,
    "stop_headsign" TEXT,
    "arrival_time" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "pickup_type" INTEGER,
    "drop_off_type" INTEGER,
    "timepoint" INTEGER,
    "shape_dist_traveled" DOUBLE PRECISION,
    "fare_units_traveled" DOUBLE PRECISION,

    CONSTRAINT "stop_times_pkey" PRIMARY KEY ("trip_id","stop_sequence")
);

-- CreateTable
CREATE TABLE "stops" (
    "stop_id" TEXT NOT NULL,
    "stop_code" TEXT,
    "stop_name" TEXT,
    "stop_lat" TEXT,
    "stop_lon" TEXT,
    "location_type" INTEGER,
    "parent_station" TEXT,
    "stop_timezone" TEXT,
    "wheelchair_boarding" INTEGER,
    "platform_code" TEXT,
    "zone_id" TEXT,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("stop_id")
);

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("route_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_times" ADD CONSTRAINT "stop_times_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_times" ADD CONSTRAINT "stop_times_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("stop_id") ON DELETE RESTRICT ON UPDATE CASCADE;
