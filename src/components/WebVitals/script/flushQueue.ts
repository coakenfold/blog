import { sendToGA4 } from "./sendToGA4";
import { sendToCustomEndpoint } from "./sendToCustomEndpoint";
import type { WebVitalMetric } from "./types";
export interface FlushQueue {
  queue: any;
  flushTimer: any;
  isDev: boolean;
  shouldRunAnalytics: any;
  currentGaId: string;
}
export const flushQueue = ({
  queue,
  flushTimer,
  isDev,
  shouldRunAnalytics,
  currentGaId,
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

  // Send to Google Analytics 4
  if (shouldRunAnalytics) {
    sendToGA4({ metrics, isDev, currentGaId });
  }

  // Optional: Also send to custom analytics endpoint
  if (shouldRunAnalytics || isDev) {
    sendToCustomEndpoint({ metrics, isDev });
  }

  // Clear the queue
  queue.clear();
};
