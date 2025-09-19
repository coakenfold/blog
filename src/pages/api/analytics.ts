import { GA4Tracker } from "./GA4Tracker";
import { loadConfig } from "./loadConfig";
import type { APIRoute } from "astro";

const enableAnalytics = import.meta.env.PUBLIC_ENABLE_ANALYTICS;
const gaId = import.meta.env.PUBLIC_GA_ID;
const configAnalytics = import.meta.env.ANALYTICS_SECRETS;
const config = loadConfig(configAnalytics);

export const prerender = false;
const ga4 = new GA4Tracker(gaId, config["ca.oakenfold.blog.dev"]);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { metrics, page_url, user_agent, timestamp, environment } = data;

    // Only process production metrics
    if (environment !== "production") {
      return new Response(
        JSON.stringify({
          error: "Production endpoint only accepts production data",
        }),
        { status: 400 }
      );
    }

    console.log(
      `📊 PRODUCTION: ${metrics.length} Web Vitals metrics from ${page_url}`
    );

    if (enableAnalytics) {
      for (const metric of metrics) {
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
        await ga4.trackCustomEvent("event", `${metric.name}-BE`, eventParams);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: metrics.length,
        environment: "production",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Production analytics error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process metrics",
      }),
      { status: 500 }
    );
  }
};
