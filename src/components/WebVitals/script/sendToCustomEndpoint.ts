import type { WebVitalMetric } from "./types";

export interface SendToCustomEndpoint {
  isDev: boolean;
  metrics: WebVitalMetric[];
}
export const sendToCustomEndpoint = ({
  isDev,
  metrics,
}: SendToCustomEndpoint) => {
  const body = JSON.stringify({
    environment: isDev ? "development" : "production",
    metrics,
    page_url: window.location.href,
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
  });

  const endpoint = isDev ? "/api/analytics-dev" : "/api/analytics";

  // Use sendBeacon for reliability during page unload
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    // Fallback for browsers without sendBeacon
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
    }).catch((error) => {
      if (isDev) {
        console.warn("Failed to send metrics to custom endpoint:", error);
      }
    });
  }
};
