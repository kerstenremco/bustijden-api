import express from "express";
import cron from "node-cron";
import { findStops, getStopTimesAtStop, getAllStopIds, getAllStops } from "./helpers";
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
  const { q, all } = req.query;
  if (all === "1") {
    const stops = await getAllStops();
    return res.json(stops);
  } else if (typeof q === "string") {
    const qWords = q.split(" ").filter((w) => w.length > 0);
    if (qWords.length === 0) {
      return res.status(400).json({ error: "Empty q query parameter" });
    }
    const stops = await findStops(qWords);
    return res.json(stops);
  }
  return res.status(400).json({ error: "Unknown action" });
});

app.listen(3000, () => console.log("Listening on port 3000!"));
// cron.schedule("30 */2 * * * *", sync);
