/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    globals: true,
    environment: "jsdom",
    exclude: [
      "**/node_modules",
      "**/cypress",
      "**/.{idea,git,cache,output,temp}",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
    ],
    include: ["**/*.test.*"],
    setupFiles: ["dotenv/config", "./vitest.setup.js"],
  },
});
