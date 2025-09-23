#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { parseString } from "xml2js";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const timestamp = new Date().toISOString();
const timestampFilename = timestamp.slice(0, 19).replace(/[T:]/g, "-");
// Results in: "2025-09-21-14-30-45" (removes milliseconds and Z)
// Configuration
const CONFIG = {
  sitemapPath: "./dist/client/sitemap-0.xml",
  outputDir: `./__generated__/lighthouse/${timestampFilename}`,
  thresholds: {
    TBT: { max: 0, violationHandler: "console.error" }, // Total Blocking Time
    LCP: { max: 1514, violationHandler: "console.error" }, // Largest Contentful Paint
    CLS: { max: 0.0, violationHandler: "console.error" }, // Cumulative Layout Shift
    FCP: { max: 1514, violationHandler: "console.error" }, // First Contentful Paint
    SI: { max: 1514, violationHandler: "console.error" }, // Speed Index
  },
  chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  lighthouseOptions: {
    logLevel: "error",
    output: "json",
    onlyCategories: ["performance"],
  },
};

class LighthouseSitemapTester {
  constructor(config = CONFIG) {
    this.config = config;
    this.results = [];
    this.violations = [];
  }

  /**
   * Parse sitemap.xml and extract URLs
   */
  async parseSitemap(sitemapPath) {
    try {
      const xmlData = await fs.readFile(sitemapPath, "utf-8");

      return new Promise((resolve, reject) => {
        parseString(xmlData, (err, result) => {
          if (err) {
            reject(new Error(`Failed to parse sitemap: ${err.message}`));
            return;
          }

          const urls = [];
          if (result.urlset && result.urlset.url) {
            result.urlset.url.forEach((urlEntry) => {
              if (urlEntry.loc && urlEntry.loc[0]) {
                urls.push(urlEntry.loc[0]);
              }
            });
          }

          resolve(urls);
        });
      });
    } catch (error) {
      throw new Error(`Failed to read sitemap file: ${error.message}`);
    }
  }

  /**
   * Launch Chrome and run Lighthouse test
   */
  async runLighthouseTest(url) {
    let chrome;

    try {
      console.log(`🔍 Testing: ${url}`);

      chrome = await chromeLauncher.launch({
        chromeFlags: this.config.chromeFlags,
      });

      const runnerResult = await lighthouse(url, {
        ...this.config.lighthouseOptions,
        port: chrome.port,
      });

      return runnerResult.lhr;
    } catch (error) {
      throw new Error(`Lighthouse test failed for ${url}: ${error.message}`);
    } finally {
      if (chrome) {
        await chrome.kill();
      }
    }
  }

  /**
   * Extract performance metrics from Lighthouse result
   */
  extractMetrics(lighthouseResult) {
    const metrics = lighthouseResult.audits;

    return {
      TBT: Math.round(metrics["total-blocking-time"]?.numericValue || 0),
      LCP: Math.round(metrics["largest-contentful-paint"]?.numericValue || 0),
      CLS: parseFloat(
        (metrics["cumulative-layout-shift"]?.numericValue || 0).toFixed(3)
      ),
      FCP: Math.round(metrics["first-contentful-paint"]?.numericValue || 0),
      SI: Math.round(metrics["speed-index"]?.numericValue || 0),
    };
  }

  /**
   * Check if metrics violate thresholds and handle violations
   */
  checkViolations(url, metrics) {
    const violations = [];

    Object.entries(this.config.thresholds).forEach(([metric, config]) => {
      const value = metrics[metric];
      const threshold = config.max;

      if (value > threshold) {
        const violation = {
          url,
          metric,
          value,
          threshold,
          message: `${metric} violation: ${value} > ${threshold}`,
        };

        violations.push(violation);

        // Handle violation based on configuration
        if (config.violationHandler === "console.error") {
          console.error(`❌ ${url} - ${violation.message}`);
        } else if (config.violationHandler === "console.log") {
          console.log(`⚠️  ${url} - ${violation.message}`);
        }
      }
    });

    return violations;
  }

  /**
   * Save detailed results to JSON file
   */
  async saveResults(url, metrics, violations, lighthouseResult) {
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Create filename from URL
    const filename = url.replace(/[^a-zA-Z0-9]/g, "_") + "_lighthouse.json";
    const filepath = path.join(this.config.outputDir, filename);

    const result = {
      url,
      timestamp: new Date().toISOString(),
      metrics,
      violations,
      passed: violations.length === 0,
      lighthouseScore: lighthouseResult.categories.performance.score * 100,
      rawLighthouseData: lighthouseResult,
    };

    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    return result;
  }

  /**
   * Generate summary report
   */
  async generateSummary() {
    const summary = {
      totalUrls: this.results.length,
      passedUrls: this.results.filter((r) => r.passed).length,
      failedUrls: this.results.filter((r) => !r.passed).length,
      totalViolations: this.violations.length,
      timestamp,
      results: this.results.map((r) => ({
        url: r.url,
        calculator: `https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${r.metrics.FCP}&SI=${r.metrics.SI}&LCP=${r.metrics.LCP}&TBT=${r.metrics.TBT}&CLS=${r.metrics.CLS}&device=mobile&version=10`,
        passed: r.passed,
        violationCount: r.violations.length,
        lighthouseScore: r.lighthouseScore,
        metrics: r.metrics,
      })),
    };

    const summaryPath = path.join(this.config.outputDir, "summary.json");
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    // Console summary
    console.log("\n📊 SUMMARY REPORT");
    console.log("=================");
    console.log(`Total URLs tested: ${summary.totalUrls}`);
    console.log(`✅ Passed: ${summary.passedUrls}`);
    console.log(`❌ Failed: ${summary.failedUrls}`);
    console.log(`Total violations: ${summary.totalViolations}`);
    console.log(`Results saved to: ${this.config.outputDir}`);

    return summary;
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log("🚀 Starting Lighthouse Sitemap Performance Tests");
      console.log(`📋 Sitemap: ${this.config.sitemapPath}`);
      console.log(`📁 Output: ${this.config.outputDir}`);
      console.log("");

      // Parse sitemap
      const urls = await this.parseSitemap(this.config.sitemapPath);
      console.log(`Found ${urls.length} URLs in sitemap\n`);

      // Test each URL
      for (const url of urls) {
        try {
          const lighthouseResult = await this.runLighthouseTest(url);
          const metrics = this.extractMetrics(lighthouseResult);
          const violations = this.checkViolations(url, metrics);

          // Save detailed results
          const result = await this.saveResults(
            url,
            metrics,
            violations,
            lighthouseResult
          );

          this.results.push(result);
          this.violations.push(...violations);

          // Console output for passed tests
          if (violations.length === 0) {
            console.log(`✅ ${url} - All metrics passed`);
          }
        } catch (error) {
          console.error(`💥 Failed to test ${url}: ${error.message}`);
        }
      }

      // Generate summary
      await this.generateSummary();
    } catch (error) {
      console.error(`💥 Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI execution

// Allow configuration override via command line arguments
const args = process.argv.slice(2);
let customConfig = { ...CONFIG };

// Simple argument parsing
args.forEach((arg, index) => {
  if (arg === "--sitemap" && args[index + 1]) {
    customConfig.sitemapPath = args[index + 1];
  }
  if (arg === "--output" && args[index + 1]) {
    customConfig.outputDir = args[index + 1];
  }
});

const tester = new LighthouseSitemapTester(customConfig);
tester.run();
