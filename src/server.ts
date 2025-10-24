import express from "express";
import cron from "node-cron";
import { findStops, getStopTimesAtStop } from "./helpers";
import { sync } from "./updaterealtime";
import { unixToDayjs, todayYyyymmdd, yyyymmddToDayjs } from "./helpers/time";
import dayjs from "dayjs";

import cors from "cors";
const app = express();
// cors
app.use(cors());

app.get("/stops", async (req, res) => {
  const { q } = req.query;
  if (typeof q !== "string") {
    res.status(400).send("Missing q query parameter");
    return;
  }
  const qWords = q.split(" ").filter((w) => w.length > 0);
  if (qWords.length === 0) {
    res.status(400).send("Empty q query parameter");
    return;
  }

  const stops = await findStops(qWords);
  res.json(stops);
});

app.get("/test", async (req, res) => {
  const now = dayjs();
  const achtuur = now.set("hour", 20).set("minute", 0).set("second", 0);
  const diff = achtuur.diff(now, "minute");
  res.json({ now: now.unix(), achtuur: achtuur.unix(), diff });
});

app.get("/stop-times/stop", async (req, res) => {
  const { date, ids } = req.query;
  if (typeof ids !== "string") {
    res.status(400).send("Missing date or ids query parameter!");
    return;
  }
  let dateStr = date as string | undefined;

  const stopIdArray = ids.split(",");
  const times = await getStopTimesAtStop(stopIdArray, dateStr);
  res.json(times);
});

app.listen(3000, () => console.log("Listening on port 3000!"));
cron.schedule("30 */2 * * * *", sync);
