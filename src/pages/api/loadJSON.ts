import { readFileSync } from "fs";

export function loadJSON(configPath = "") {
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    return config;
  } catch (error) {
    console.error("Failed to load config:", error);
    return {};
  }
}
