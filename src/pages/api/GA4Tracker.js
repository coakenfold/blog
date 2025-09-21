export class GA4Tracker {
  constructor(measurementId, apiSecret) {
    this.measurementId = measurementId; // Your GA4 Measurement ID (G-XXXXXXXXXX)
    this.apiSecret = apiSecret; // API secret from GA4 interface
    this.baseUrl = "https://www.google-analytics.com/mp/collect";
  }

  async sendEvent(clientId, eventName, eventParameters = {}) {
    const payload = {
      client_id: clientId, // Unique identifier for the user
      events: [
        {
          name: eventName,
          params: eventParameters,
        },
      ],
    };

    try {
      const response = await fetch(
        `${this.baseUrl}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Event sent successfully");
      return response.data;
    } catch (error) {
      console.error(
        "Error sending event to GA4:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Send a custom event
  async trackCustomEvent(clientId, eventName, customParams = {}) {
    return this.sendEvent(clientId, eventName, {
      ...customParams,
      timestamp: new Date().toISOString(),
    });
  }
}
