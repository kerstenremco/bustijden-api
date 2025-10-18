import express from "express";
import cron from "node-cron";
import { findStops, getStopTimesAtStop } from "./helpers";
import { sync } from "./updaterealtime";

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

app.get("/stop-times/stop", async (req, res) => {
  const { date, ids } = req.query;
  if (typeof date !== "string" || typeof ids !== "string") {
    res.status(400).send("Missing date or ids query parameter!");
    return;
  }

  const stopIdArray = ids.split(",");
  const times = await getStopTimesAtStop(stopIdArray, date);
  res.json(times);
});

app.listen(3000, () => console.log("Listening on port 3000!"));
cron.schedule("30 */2 * * * *", sync);
