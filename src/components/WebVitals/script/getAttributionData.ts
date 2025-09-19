import type { WebVitalMetric } from "./types";
export interface GetAttributionData {
  metric: WebVitalMetric;
}
export const getAttributionData = ({ metric }: GetAttributionData) => {
  const { name, attribution } = metric;
  const attributionData: { [key: string]: any } = {};

  switch (name) {
    case "CLS":
      if (attribution) {
        attributionData.debug_target =
          attribution.largestShiftTarget || "unknown";
        attributionData.largest_shift_time = attribution.largestShiftTime;
        attributionData.largest_shift_value = attribution.largestShiftValue;
        attributionData.load_state = attribution.loadState;
      }
      break;

    case "INP":
      if (attribution) {
        attributionData.debug_target =
          attribution.interactionTarget || "unknown";
        attributionData.interaction_type = attribution.interactionType;
        attributionData.interaction_time = attribution.interactionTime;
        attributionData.input_delay = attribution.inputDelay;
        attributionData.processing_duration = attribution.processingDuration;
        attributionData.presentation_delay = attribution.presentationDelay;
        attributionData.load_state = attribution.loadState;
      }
      break;

    case "LCP":
      if (attribution) {
        attributionData.debug_target = attribution.target || "unknown";
        attributionData.resource_url = attribution.url;
        attributionData.time_to_first_byte = attribution.timeToFirstByte;
        attributionData.resource_load_delay = attribution.resourceLoadDelay;
        attributionData.resource_load_duration =
          attribution.resourceLoadDuration;
        attributionData.element_render_delay = attribution.elementRenderDelay;
      }
      break;

    case "FCP":
      if (attribution) {
        attributionData.time_to_first_byte = attribution.timeToFirstByte;
        attributionData.first_byte_to_fcp = attribution.firstByteToFCP;
        attributionData.load_state = attribution.loadState;
      }
      break;

    case "TTFB":
      if (attribution) {
        attributionData.waiting_duration = attribution.waitingDuration;
        attributionData.cache_duration = attribution.cacheDuration;
        attributionData.dns_duration = attribution.dnsDuration;
        attributionData.connection_duration = attribution.connectionDuration;
        attributionData.request_duration = attribution.requestDuration;
      }
      break;
  }

  return attributionData;
};
