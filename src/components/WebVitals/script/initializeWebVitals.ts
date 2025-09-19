import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals/attribution";
import { type GetAttributionDataReturn } from "./getAttributionData";
import { addToQueue } from "./addToQueue.ts";
import { flushQueue } from "./flushQueue";
import { type WebVitalMetric } from "./types.ts";

export type QueueEntry = {
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

  // Timestamp for when this metric was captured
  timestamp: number;
} & Partial<GetAttributionDataReturn>;

export interface InitializeWebVitals {
  shouldRunAnalytics: boolean;
  isDev: boolean;
  currentGaId: string;
  queue: Set<QueueEntry>;
}

export const initializeWebVitals = ({
  shouldRunAnalytics,
  isDev,
  currentGaId,
  queue,
}: InitializeWebVitals) => {
  let flushTimer: ReturnType<typeof setTimeout>;

  // Set up metric collection - only if analytics should run
  if (shouldRunAnalytics || isDev) {
    const onReport = (metric: WebVitalMetric) => {
      const addToQueueFlushTimer = addToQueue({
        metric,
        shouldRunAnalytics,
        isDev,
        flushTimer,
        queue,
        flushQueue: () => {
          flushQueue({
            queue,
            flushTimer,
            isDev,
            shouldRunAnalytics,
            currentGaId,
          });
        },
      });
      if (addToQueueFlushTimer) {
        flushTimer = addToQueueFlushTimer;
      }
    };

    onCLS(onReport, { reportAllChanges: true });
    onINP(onReport, { reportAllChanges: true });
    onLCP(onReport, { reportAllChanges: true });
    onFCP(onReport);
    onTTFB(onReport);

    if (isDev) {
      console.log("🚀 Web Vitals tracking initialized:", {
        environment: "development",
        gaId: currentGaId || "none",
        analyticsEnabled: shouldRunAnalytics,
      });
    }
  }

  // Flush queue when page becomes hidden
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushQueue({
        queue,
        flushTimer,
        isDev,
        shouldRunAnalytics,
        currentGaId,
      });
    }
  });

  // Flush queue before page unloads (fallback)
  addEventListener("beforeunload", () => {
    flushQueue({
      queue,
      flushTimer,
      isDev,
      shouldRunAnalytics,
      currentGaId,
    });
  });

  // Optional: Flush queue when user becomes idle (shorter timeout in dev)
  let idleTimer: ReturnType<typeof setTimeout>;
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => {
        if (queue.size > 0) {
          if (isDev) {
            console.log("⏰ Flushing queue due to user inactivity");
          }
          flushQueue({
            queue,
            flushTimer,
            isDev,
            shouldRunAnalytics,
            currentGaId,
          });
        }
      },
      isDev ? 30000 : 60000
    ); // 30s in dev, 1min in prod
  }

  // Reset idle timer on user activity
  ["mousedown", "mousemove", "keypress", "scroll", "touchstart"].forEach(
    (event) => {
      addEventListener(event, resetIdleTimer, { passive: true });
    }
  );

  // Start idle timer
  resetIdleTimer();
};
