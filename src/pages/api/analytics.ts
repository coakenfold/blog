import type { APIRoute } from "astro";

export const prerender = false;

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

    // Store in production database, send to monitoring services, etc.
    // await storeInDatabase(metrics);
    // await sendToMonitoring(metrics);

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
