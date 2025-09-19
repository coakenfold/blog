import { initializeWebVitals } from "./initializeWebVitals";
import type { WebVitalMetric } from "./types";
// Get config from global variables set by Astro
const config = window.webVitalsConfig || {};
const { gaId, enableAnalytics = true, isDev = false } = config;

// Determine which GA ID to use
const currentGaId = gaId;

// Check if we should run analytics in current environment
const shouldRunAnalytics = enableAnalytics;

const queue: Set<WebVitalMetric> = new Set();

const callInitializeWebVitals = () => {
  initializeWebVitals({
    shouldRunAnalytics,
    isDev,
    currentGaId,
    queue,
  });
};
// Wait for DOM and GA to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(callInitializeWebVitals, 100); // Small delay to let GA load
  });
} else {
  setTimeout(callInitializeWebVitals, 100);
}
