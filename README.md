# Bustijden API

An API that shows upcomming busses for a certain busstop in The Netherlands.
Data is based on [GTFS data from OVAPI](https://gtfs.ovapi.nl/)

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DATABASE_URL`

`REDIS_URL`

`USER_AGENT`

## Deployment

Make sure you have a Postgres database and a Redis instance

- Create .env file
- Run `npm i`
- Run `npx prisma generate` to create the prisma classes
- Run `npm run build` to build project
- Run `npx prisma migrate deploy` to apply latest migrations

### Update

- Run `npm i`
- Run `npx prisma generate` to create the prisma classes
- Run `npm run build` to build project
- Run `npx prisma migrate deploy` to apply latest migrations

### Import / update static data

Run the importstaticdata script

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
