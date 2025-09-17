import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { metrics, page_url, user_agent, timestamp, environment } = data;

    console.log(`🔧 DEV ANALYTICS: Received ${metrics.length} metrics`);
    console.log(`📍 Page: ${page_url}`);
    console.log(`⏰ Time: ${new Date(timestamp).toISOString()}`);

    // Enhanced development logging
    metrics.forEach((metric, index) => {
      console.log(`\n--- Metric ${index + 1}: ${metric.name} ---`);
      console.log(`Value: ${metric.value} (${metric.rating})`);
      console.log(`Navigation: ${metric.navigationType}`);

      if (metric.debug_target) {
        console.log(`🎯 Debug Target: ${metric.debug_target}`);
      }

      // Log attribution-specific data
      switch (metric.name) {
        case "CLS":
          if (metric.largest_shift_time) {
            console.log(`⚠️ Largest shift at: ${metric.largest_shift_time}ms`);
            console.log(`📄 Load state: ${metric.load_state}`);
          }
          break;

        case "INP":
          if (metric.interaction_type) {
            console.log(`🖱️ Interaction: ${metric.interaction_type}`);
            console.log(`⏱️ Input delay: ${metric.input_delay}ms`);
            console.log(`⚙️ Processing: ${metric.processing_duration}ms`);
            console.log(`🎨 Presentation: ${metric.presentation_delay}ms`);
          }
          break;

        case "LCP":
          if (metric.time_to_first_byte) {
            console.log(`🌐 TTFB: ${metric.time_to_first_byte}ms`);
            console.log(
              `📦 Resource load delay: ${metric.resource_load_delay}ms`
            );
            console.log(
              `⏳ Resource load duration: ${metric.resource_load_duration}ms`
            );
            console.log(
              `🖼️ Element render delay: ${metric.element_render_delay}ms`
            );
          }
          break;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: metrics.length,
        environment: "development",
        message: "Check console for detailed metrics",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Development analytics error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process dev metrics",
      }),
      { status: 500 }
    );
  }
};
