import { initializeWebVitals } from "./initializeWebVitals";
import { type QueueEntry } from "./initializeWebVitals";

// Get config from global variables
const nameSpace = window["ca.oakenfold.blog"] || {};
const {
  idGA4,
  shouldEnableAnalyticsFE = false,
  shouldEnableAnalyticsBE = false,
} = nameSpace.analytics;

const callInitializeWebVitals = () => {
  initializeWebVitals({
    shouldEnableAnalyticsFE,
    shouldEnableAnalyticsBE,
    isDev: nameSpace.isDev,
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
