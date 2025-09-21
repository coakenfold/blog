import { initializeWebVitals } from "./initializeWebVitals";
import { type QueueEntry } from "./initializeWebVitals";

// Get config from global variables
const nameSpace = window["ca.oakenfold.blog"] || {};
const {
  idGA4,
  shouldEnableAnalytics = false,
  shouldEnableAnalyticsFE = false,
  shouldEnableAnalyticsBE = false,
} = nameSpace.config.analytics;

const callInitializeWebVitals = () => {
  initializeWebVitals({
    shouldEnableAnalytics,
    shouldEnableAnalyticsFE,
    shouldEnableAnalyticsBE,
    isDev: nameSpace.config.isDev,
    idGA4,
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
