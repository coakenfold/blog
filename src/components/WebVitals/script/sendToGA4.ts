import type { WebVitalMetric } from "./types";

export interface SendToGA4 {
  metrics: WebVitalMetric[];
  isDev: boolean;
  currentGaId: string;
}
export const sendToGA4 = ({ metrics, isDev, currentGaId }: SendToGA4) => {
  // Check if gtag is available, if not, wait for it
  if (typeof window.gtag === "undefined") {
    if (isDev) {
      console.log("⏳ Waiting for gtag to load...");
    }

    // Wait for gtag to be available, then retry
    const checkGtag = () => {
      if (typeof window.gtag !== "undefined") {
        sendToGA4({ metrics, isDev, currentGaId });
      } else {
        // Retry after a short delay, up to 10 times (5 seconds total)
        setTimeout(checkGtag, 500);
      }
    };

    setTimeout(checkGtag, 100);
    return;
  }

  // Send each metric as a separate event to GA4
  metrics.forEach((metric) => {
    const eventParams = {
      // Standard GA4 event parameters
      value: metric.delta, // Use delta so values can be summed

      // Custom parameters for the metric
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      navigation_type: metric.navigationType,
      // @ts-ignore
      environment: metric.environment,
      // @ts-ignore
      hostname: metric.hostname,

      // Attribution data (flatten the object)
      ...Object.fromEntries(
        Object.entries(metric)
          .filter(
            ([key]) =>
              ![
                "name",
                "value",
                "delta",
                "id",
                "rating",
                "navigationType",
                "timestamp",
                "environment",
                "hostname",
              ].includes(key)
          )
          .map(([key, value]) => [key, value])
      ),
    };

    // Send to GA4
    window.gtag("event", `${metric.name}-FE`, eventParams);
  });

  if (isDev) {
    console.log(`✅ Sent ${metrics.length} metrics to GA4 (${currentGaId})`);
  }
};
