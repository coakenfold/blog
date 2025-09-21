import { sendToGA4 } from "./sendToGA4";
import { sendToCustomEndpoint } from "./sendToCustomEndpoint";
import type { WebVitalMetric } from "./types";
export interface FlushQueue {
  flushTimer: any;
  idGA4: string;
  isDev: boolean;
  queue: any;
  shouldEnableAnalytics: boolean;
  shouldEnableAnalyticsFE: boolean;
  shouldEnableAnalyticsBE: boolean;
}
export const flushQueue = ({
  flushTimer,
  idGA4,
  isDev,
  queue,
  shouldEnableAnalytics,
  shouldEnableAnalyticsFE,
  shouldEnableAnalyticsBE,
}: FlushQueue) => {
  if (queue.size === 0) return;

  clearTimeout(flushTimer);

  // Convert Set to Array for processing
  const metrics: WebVitalMetric[] = Array.from(queue);

  if (isDev) {
    console.group(`📊 Flushing ${metrics.length} Web Vitals metrics`);
    console.table(
      metrics.map((m) => ({
        name: m.name,
        value: m.value,
        rating: m.rating,
        // @ts-ignore
        debug_target: m.debug_target || "N/A",
        // @ts-ignore
        environment: m.environment,
      }))
    );
    console.groupEnd();
  }

  if (shouldEnableAnalytics) {
    // Send to Google Analytics 4
    if (shouldEnableAnalyticsFE) {
      sendToGA4({ metrics, isDev, idGA4 });
    }

    // Optional: Also send to custom analytics endpoint
    if (shouldEnableAnalyticsBE) {
      sendToCustomEndpoint({ metrics, isDev });
    }
  }

  // Clear the queue
  queue.clear();
};
