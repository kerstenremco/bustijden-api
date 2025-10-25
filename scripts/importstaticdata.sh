#!/bin/sh
set -e

echo "Downloading data"
rm -f gtfs-nl.zip
rm -f *.txt
if wget https://gtfs.ovapi.nl/nl/gtfs-nl.zip; then
    echo "Download completed successfully"
else
    echo "Download failed"
    exit 1
fi
unzip gtfs-nl.zip

echo "Truncating existing data..."
if psql -d gtfs -U gtfsuser -c "TRUNCATE trips, stop_times, routes, stops, calendar_dates;"; then
    echo "Dropped existing data successfully"
else
    echo "Failed to drop existing data"
    exit 1
fi

echo "Importing calendar_dates"
if psql -d gtfs -U gtfsuser -c "\copy calendar_dates(service_id, date, exception_type) from 'calendar_dates.txt' with(FORMAT csv, DELIMITER ',', HEADER, QUOTE '\"', ESCAPE '''')"; then
    echo "Importing calendar_dates"
else
    echo "Failed to import calendar_dates"
    exit 1
fi

echo "Importing routes"
if psql -d gtfs -U gtfsuser -c "\copy routes(route_id, agency_id, route_short_name, route_long_name, route_desc, route_type, route_color, route_text_color, route_url) from 'routes.txt' with(FORMAT csv, DELIMITER ',', HEADER, QUOTE '\"', ESCAPE '''')"; then
    echo "Importing routes"
else
    echo "Failed to import routes"
    exit 1
fi

echo "Importing stops"
if psql -d gtfs -U gtfsuser -c "\copy stops(stop_id, stop_code, stop_name, stop_lat, stop_lon, location_type, parent_station, stop_timezone, wheelchair_boarding, platform_code, zone_id) from 'stops.txt' with(FORMAT csv, DELIMITER ',', HEADER, QUOTE '\"', ESCAPE '''')"; then
    echo "Importing stops"
else
    echo "Failed to import stops"
    exit 1
fi

echo "Importing trips"
if psql -d gtfs -U gtfsuser -c "\copy trips(route_id, service_id, trip_id, realtime_trip_id, trip_headsign, trip_short_name, trip_long_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed) from 'trips.txt' with(FORMAT csv, DELIMITER ',', HEADER, QUOTE '\"', ESCAPE '''')"; then
    echo "Importing trips"
else
    echo "Failed to import trips"
    exit 1
fi

echo "Importing stop_times"
if psql -d gtfs -U gtfsuser -c "\copy stop_times(trip_id, stop_sequence, stop_id, stop_headsign, arrival_time, departure_time, pickup_type, drop_off_type, timepoint, shape_dist_traveled, fare_units_traveled) from 'stop_times.txt' with(FORMAT csv, DELIMITER ',', HEADER, QUOTE '\"', ESCAPE '''')"; then
    echo "Importing stop_times"
else
    echo "Failed to import stop_times"
    exit 1
fi

echo "Static GTFS data import completed successfully."