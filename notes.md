Setup ec2

Connect to psql

```bash
psql -h localhost -U gtfsuser -d gtfs
```

Import CSV

```sql
\copy public."stops" (stop_id, stop_code, stop_name, stop_lat, stop_lon, location_type, parent_station, stop_timezone, wheelchair_boarding, platform_code, zone_id) FROM '/tmp/stops.txt' DELIMITER ',' CSV HEADER;
```

Get stop times at specific stop

```sql
-- Active services
SELECT service_id FROM calendar_dates WHERE date = '20251009';

SELECT
	st.stop_id, stops.stop_name,
	st.arrival_time, st.departure_time,
	routes.route_short_name AS route_shortname, routes.route_long_name AS route_name,
	trips.trip_headsign, st.stop_headsign
FROM stop_times AS st
	INNER JOIN trips ON st.trip_id = trips.trip_id
	INNER JOIN routes ON trips.route_id = routes.route_id
	INNER JOIN stops ON stops.stop_id = st.stop_id
WHERE
	st.stop_id IN (
		SELECT stop_id FROM stops
		WHERE stop_name ILIKE '%lommerberge%'
	)
	AND trips.service_id IN (
		SELECT service_id FROM calendar_dates WHERE date = '20251014'
	)
ORDER BY
	st.arrival_time ASC
;
```
