# Bustijden API

An API that shows upcomming busses for a certain busstop in The Netherlands.
Data is based on [GTFS data from OVAPI](https://gtfs.ovapi.nl/)

## Deployment

- Run `docker compose up -d`

### Import / update static data

- Connect to the database container, eg `docker exec -it bustijden-api-database-1 bash`
- Run in /app `bash import.sh`

## API Reference

#### Get all items

```http
  GET /stops?q=${query}
  Example: /stops?q=groningen%20rembrand
```

| Parameter | Type     | Description                 |
| :-------- | :------- | :-------------------------- |
| `query`   | `string` | **Required**. Search a stop |

#### Get item

```http
  GET /stops/${baseKey}?date=${date}
  Example: /stops/S3JpbXBlbiBhL2QgTGVrLCBSZW1icmFuZHRzdHJhYXQ=?date=20251025
```

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `baseKey` | `string` | **Required**. The baseKey of the stop. |
| `date`    | `string` | **Optional**. Date to show, YYYYMMDD.  |

## Contributing

Contributions are always welcome!

## Tech Stack

**Server:** Postgres, Redis, NodeJS
