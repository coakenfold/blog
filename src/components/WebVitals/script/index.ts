import { initializeWebVitals } from "./initializeWebVitals";
import { type QueueEntry } from "./initializeWebVitals";
// Get config from global variables set by Astro
const config = window.webVitalsConfig || {};
const { gaId, enableAnalytics = true, isDev = false } = config;

const callInitializeWebVitals = () => {
  initializeWebVitals({
    shouldRunAnalytics: enableAnalytics,
    isDev,
    currentGaId: gaId,
    queue: new Set<QueueEntry>(),
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
