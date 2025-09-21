import { getAttributionData } from "./getAttributionData";

import { type WebVitalMetric } from "./types";
import { type InitializeWebVitals } from "./initializeWebVitals";

export interface AddToQueue {
  flushQueue: () => void;
  flushTimer: ReturnType<typeof setTimeout>;
  isDev: boolean;
  metric: WebVitalMetric;
  queue: InitializeWebVitals["queue"];
  shouldEnableAnalytics: boolean;
}

export const addToQueue = ({
  flushQueue,
  flushTimer,
  isDev,
  metric,
  queue,
  shouldEnableAnalytics,
}: AddToQueue) => {
  if (!shouldEnableAnalytics) {
    if (isDev) {
      console.log("🔍 Web Vitals (DEV):", {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        attribution: metric.attribution,
      });
    }
    return;
  }

  // Create enhanced metric object with attribution data
  queue.add({
    // Standard metric properties
    delta: metric.delta,
    id: metric.id,
    name: metric.name,
    navigationType: metric.navigationType,
    rating: metric.rating,
    value: metric.value,

    // Add environment context
    environment: isDev ? "development" : "production",
    hostname: window.location.hostname,

    // Timestamp for when this metric was captured
    timestamp: Date.now(),

    // Add attribution-specific data based on metric type
    ...getAttributionData({ metric }),
  });

  // Optional: Set a timeout to flush queue if page stays open too long
  clearTimeout(flushTimer);

  return setTimeout(flushQueue, isDev ? 10000 : 30000); // Shorter flush in dev
};
