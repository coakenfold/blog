import type { WebVitalMetric } from "./types";

export interface SendToCustomEndpoint {
  metrics: WebVitalMetric[];
  isDev: boolean;
}
export const sendToCustomEndpoint = ({
  metrics,
  isDev,
}: SendToCustomEndpoint) => {
  // Optional: Send batched data to your own analytics endpoint
  const body = JSON.stringify({
    metrics: metrics,
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    timestamp: Date.now(),
    environment: isDev ? "development" : "production",
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
