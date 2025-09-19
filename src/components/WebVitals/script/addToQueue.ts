import { getAttributionData } from "./getAttributionData";
import type { WebVitalMetric } from "./types";

export interface QueueEntry {
  // Standard metric properties
  name: WebVitalMetric["name"];
  value: WebVitalMetric["value"];
  delta: WebVitalMetric["delta"];
  id: WebVitalMetric["id"];
  rating: WebVitalMetric["rating"];
  navigationType: WebVitalMetric["navigationType"];

  // Add environment context
  environment: "development" | "production";
  hostname: string;

  // Add attribution-specific data based on metric type
  // ...getAttributionData({ metric }),

  // Timestamp for when this metric was captured
  timestamp: number;
}
export interface AddToQueue {
  metric: WebVitalMetric;
  shouldRunAnalytics: boolean;
  isDev: boolean;
  queue: Set<WebVitalMetric>;
  flushTimer: ReturnType<typeof setTimeout>;
  flushQueue: () => void;
}

export const addToQueue = ({
  metric,
  shouldRunAnalytics,
  isDev,
  queue,
  flushTimer,
  flushQueue,
}: AddToQueue) => {
  if (!shouldRunAnalytics) {
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
  const enhancedMetric = {
    // Standard metric properties
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    rating: metric.rating,
    navigationType: metric.navigationType,

    // Add environment context
    environment: isDev ? "development" : "production",
    hostname: window.location.hostname,

    // Add attribution-specific data based on metric type
    ...getAttributionData({ metric }),

    // Timestamp for when this metric was captured
    timestamp: Date.now(),
  };
  // @ts-ignore
  queue.add(enhancedMetric);

  // Optional: Set a timeout to flush queue if page stays open too long
  clearTimeout(flushTimer);
  return setTimeout(flushQueue, isDev ? 10000 : 30000); // Shorter flush in dev
};
