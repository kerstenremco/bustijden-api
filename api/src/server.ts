import express from "express";
import cron from "node-cron";
import { findStops, getStopTimesAtStop, getAllStopIds } from "./helpers";
import { sync } from "./updaterealtime";

import cors from "cors";
import { baseKeyToStop } from "./helpers/stops";
const app = express();
// cors
app.use(cors());

app.get("/stops/:baseKey", async (req, res) => {
  const { baseKey } = req.params;
  const { date } = req.query;
  let dateStr = date as string | undefined;

  const stopName = baseKeyToStop(baseKey);
  const stops = await getAllStopIds(stopName);
  if (stops.length === 0) {
    res.status(404).send("Stop not found");
    return;
  }

  const times = await getStopTimesAtStop(stops, dateStr);

  res.send(times);
});

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

app.listen(3000, () => console.log("Listening on port 3000!"));
cron.schedule("30 */2 * * * *", sync);
