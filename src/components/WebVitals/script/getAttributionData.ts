import type {
  WebVitalMetric,
  CLSAttribution,
  INPAttribution,
  LCPAttribution,
  FCPAttribution,
  TTFBAttribution,
} from "./types";

export interface GetAttributionData {
  metric: WebVitalMetric;
}
export interface GetAttributeDataCLS {
  debug_target: string;
  largest_shift_time: CLSAttribution["largestShiftTarget"];
  largest_shift_value: CLSAttribution["largestShiftTime"];
  load_state: CLSAttribution["loadState"];
}
export interface GetAttributeDataINP {
  debug_target: INPAttribution["interactionTarget"];
  interaction_time: INPAttribution["interactionTime"];
  interaction_type: INPAttribution["interactionType"];
  load_state: INPAttribution["loadState"];
  presentation_delay: INPAttribution["presentationDelay"];
  processing_duration: INPAttribution["processingDuration"];
}
export interface GetAttributeDataLCP {
  debug_target: LCPAttribution["target"];
  element_render_delay: LCPAttribution["elementRenderDelay"];
  resource_load_delay: LCPAttribution["resourceLoadDelay"];
  resource_load_duration: LCPAttribution["resourceLoadDuration"];
  resource_url: LCPAttribution["url"];
  time_to_first_byte: LCPAttribution["timeToFirstByte"];
}
export interface GetAttributeDataFCP {
  first_byte_to_fcp: FCPAttribution["firstByteToFCP"];
  load_state: FCPAttribution["loadState"];
  time_to_first_byte: FCPAttribution["timeToFirstByte"];
}
export interface GetAttributeDataTTFP {
  cache_duration: TTFBAttribution["cacheDuration"];
  connection_duration: TTFBAttribution["connectionDuration"];
  dns_duration: TTFBAttribution["dnsDuration"];
  request_duration: TTFBAttribution["requestDuration"];
  waiting_duration: TTFBAttribution["waitingDuration"];
}

export type GetAttributionDataReturn =
  | GetAttributeDataCLS
  | GetAttributeDataINP
  | GetAttributeDataLCP
  | GetAttributeDataFCP
  | GetAttributeDataTTFP;

export const getAttributionData = ({ metric }: GetAttributionData) => {
  const { name, attribution } = metric;
  let attributionData;

  if (attribution) {
    switch (name) {
      case "CLS":
        attributionData = {
          debug_target: attribution.largestShiftTarget || "unknown",
          largest_shift_time: attribution.largestShiftTime,
          largest_shift_value: attribution.largestShiftValue,
          load_state: attribution.loadState,
        } as GetAttributeDataCLS;
        break;

      case "INP":
        attributionData = {
          debug_target: attribution.interactionTarget || "unknown",
          input_delay: attribution.inputDelay,
          interaction_time: attribution.interactionTime,
          interaction_type: attribution.interactionType,
          load_state: attribution.loadState,
          presentation_delay: attribution.presentationDelay,
          processing_duration: attribution.processingDuration,
        } as GetAttributeDataINP;
        break;

      case "LCP":
        attributionData = {
          debug_target: attribution.target || "unknown",
          element_render_delay: attribution.elementRenderDelay,
          resource_load_delay: attribution.resourceLoadDelay,
          resource_load_duration: attribution.resourceLoadDuration,
          resource_url: attribution.url,
          time_to_first_byte: attribution.timeToFirstByte,
        } as GetAttributeDataLCP;
        break;

      case "FCP":
        attributionData = {
          first_byte_to_fcp: attribution.firstByteToFCP,
          load_state: attribution.loadState,
          time_to_first_byte: attribution.timeToFirstByte,
        } as GetAttributeDataFCP;
        break;

      case "TTFB":
        attributionData = {
          cache_duration: attribution.cacheDuration,
          connection_duration: attribution.connectionDuration,
          dns_duration: attribution.dnsDuration,
          request_duration: attribution.requestDuration,
          waiting_duration: attribution.waitingDuration,
        } as GetAttributeDataTTFP;

        break;
    }
  }

  return attributionData;
};
