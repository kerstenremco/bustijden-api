import promClient from "prom-client";

export const register = new promClient.Registry();

export const apiCounter = new promClient.Counter({
  name: "api_counter",
  help: "API requests",
  labelNames: ["type"],
});
register.registerMetric(apiCounter);

export const realTimeUpdateCounter = new promClient.Counter({
  name: "rt_updates",
  help: "Realtime updates counter",
  labelNames: ["type"],
});
register.registerMetric(realTimeUpdateCounter);
