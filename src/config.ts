// src/config.ts
const {
  PUBLIC_GA_ID,
  PUBLIC_ENABLE_ANALYTICS,
  PUBLIC_ENABLE_ANALYTICS_FE,
  PUBLIC_ENABLE_ANALYTICS_BE,
  DEV,
} = import.meta.env;

export interface ConfigAnalytics {
  idGA4: string;
  shouldLoadGA4: boolean;
  shouldEnableAnalytics: boolean;
  shouldEnableAnalyticsFE: boolean;
  shouldEnableAnalyticsBE: boolean;
}
export interface Config {
  isDev: boolean;
  analytics: ConfigAnalytics;
}
export const config: Config = {
  isDev: DEV,
  analytics: {
    idGA4: PUBLIC_GA_ID,
    shouldLoadGA4:
      PUBLIC_ENABLE_ANALYTICS === "true" && PUBLIC_GA_ID !== undefined,
    shouldEnableAnalytics: PUBLIC_ENABLE_ANALYTICS === "true",
    shouldEnableAnalyticsFE: PUBLIC_ENABLE_ANALYTICS_FE === "true",
    shouldEnableAnalyticsBE: PUBLIC_ENABLE_ANALYTICS_BE === "true",
  },
};
