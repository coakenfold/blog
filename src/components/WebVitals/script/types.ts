import type {
  CLSMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
  FCPMetricWithAttribution,
  TTFBMetricWithAttribution,
} from "web-vitals/attribution";

export type {
  CLSAttribution,
  INPAttribution,
  LCPAttribution,
  FCPAttribution,
  TTFBAttribution,
} from "web-vitals/attribution";

export type WebVitalMetric =
  | CLSMetricWithAttribution
  | INPMetricWithAttribution
  | LCPMetricWithAttribution
  | FCPMetricWithAttribution
  | TTFBMetricWithAttribution;
