import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals/attribution";
import { type GetAttributionDataReturn } from "./getAttributionData.ts";
import { addToQueue } from "./addToQueue.ts";
import { flushQueue } from "./flushQueue.ts";
import { type WebVitalMetric } from "./types.ts";

export type QueueEntry = {
  // Standard metric properties
  delta: WebVitalMetric["delta"];
  id: WebVitalMetric["id"];
  name: WebVitalMetric["name"];
  navigationType: WebVitalMetric["navigationType"];
  rating: WebVitalMetric["rating"];
  value: WebVitalMetric["value"];

  // Add environment context
  environment: "development" | "production";
  hostname: string;

  // Timestamp for when this metric was captured
  timestamp: number;
} & Partial<GetAttributionDataReturn>;

export interface InitializeWebVitals {
  idGA4: string;
  isDev: boolean;
  queue: Set<QueueEntry>;
  shouldEnableAnalyticsBE: boolean;
  shouldEnableAnalyticsFE: boolean;
}

export const initializeWebVitals = ({
  idGA4,
  isDev,
  queue,
  shouldEnableAnalyticsBE,
  shouldEnableAnalyticsFE,
}: InitializeWebVitals) => {
  let flushTimer: ReturnType<typeof setTimeout>;

  // Set up metric collection - only if analytics should run
  const onReport = (metric: WebVitalMetric) => {
    const addToQueueFlushTimer = addToQueue({
      metric,
      isDev,
      flushTimer,
      queue,
      flushQueue: () => {
        flushQueue({
          flushTimer,
          idGA4,
          isDev,
          queue,
          shouldEnableAnalyticsBE,
          shouldEnableAnalyticsFE,
        });
      },
    });
    if (addToQueueFlushTimer) {
      flushTimer = addToQueueFlushTimer;
    }

    onCLS(onReport, { reportAllChanges: true });
    onINP(onReport, { reportAllChanges: true });
    onLCP(onReport, { reportAllChanges: true });
    onFCP(onReport);
    onTTFB(onReport);

    if (isDev) {
      console.log("🚀 Web Vitals tracking initialized:", {
        environment: "development",
        idGA4: idGA4 || "none",
        shouldEnableAnalyticsBE,
        shouldEnableAnalyticsFE,
      });
    }
  };

  // Flush queue when page becomes hidden
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushQueue({
        flushTimer,
        idGA4,
        isDev,
        queue,
        shouldEnableAnalyticsBE,
        shouldEnableAnalyticsFE,
      });
    }
  });

  // Flush queue before page unloads (fallback)
  addEventListener("beforeunload", () => {
    flushQueue({
      flushTimer,
      idGA4,
      isDev,
      queue,
      shouldEnableAnalyticsBE,
      shouldEnableAnalyticsFE,
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
            flushTimer,
            idGA4,
            isDev,
            queue,
            shouldEnableAnalyticsBE,
            shouldEnableAnalyticsFE,
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
