// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://localhost:4321",
  integrations: [mdx(), sitemap()],

  adapter: cloudflare(),
});
