#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { parseString } from "xml2js";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const timestamp = new Date().toISOString();
const timestampFilename = timestamp.slice(0, 19).replace(/[T:]/g, "-");
// Results in: "2025-09-21-14-30-45" (removes milliseconds and Z)

// Default configuration
const DEFAULT_CONFIG = {
  sitemapPath: "./dist/sitemap-0.xml",
  outputDir: `./__generated__/lighthouse/${timestampFilename}`,
  runs: 3, // Number of runs to perform for each URL
  cooldownMs: 2000, // Cooldown between runs in milliseconds
  thresholds: {
    TBT: { max: 0, violationHandler: "console.log" }, // Total Blocking Time
    LCP: { max: 1514, violationHandler: "console.log" }, // Largest Contentful Paint
    CLS: { max: 0.0, violationHandler: "console.log" }, // Cumulative Layout Shift
    FCP: { max: 1514, violationHandler: "console.log" }, // First Contentful Paint
    SI: { max: 1514, violationHandler: "console.log" }, // Speed Index
  },
  chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
  lighthouseOptions: {
    logLevel: "error",
    output: "json",
    onlyCategories: ["performance"],
  },
};

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Lighthouse Sitemap Performance Tester

Usage: node lighthouse-sitemap-tester.js [options]

Options:
  --sitemap <path>     Path to sitemap.xml file (default: ${DEFAULT_CONFIG.sitemapPath})
  --output <dir>       Output directory for results (default: ${DEFAULT_CONFIG.outputDir})
  --runs <number>      Number of runs per URL (default: ${DEFAULT_CONFIG.runs})
  --cooldown <ms>      Cooldown between runs in milliseconds (default: ${DEFAULT_CONFIG.cooldownMs})
  --help, -h           Show this help message

Examples:
  node lighthouse-sitemap-tester.js --sitemap ./sitemap.xml --output ./results --runs 5
  node lighthouse-sitemap-tester.js --sitemap /path/to/sitemap.xml --runs 1
`);
    process.exit(0);
  }

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--sitemap":
        if (!nextArg) {
          console.error("Error: --sitemap requires a path argument");
          process.exit(1);
        }
        config.sitemapPath = nextArg;
        i++; // Skip next argument since we consumed it
        break;

      case "--output":
        if (!nextArg) {
          console.error("Error: --output requires a directory path argument");
          process.exit(1);
        }
        config.outputDir = nextArg;
        i++; // Skip next argument since we consumed it
        break;

      case "--runs":
        if (!nextArg || isNaN(parseInt(nextArg, 10))) {
          console.error("Error: --runs requires a valid number argument");
          process.exit(1);
        }
        const runsValue = parseInt(nextArg, 10);
        if (runsValue < 1) {
          console.error("Error: --runs must be at least 1");
          process.exit(1);
        }
        config.runs = runsValue;
        i++; // Skip next argument since we consumed it
        break;

      case "--cooldown":
        if (!nextArg || isNaN(parseInt(nextArg, 10))) {
          console.error(
            "Error: --cooldown requires a valid number argument (milliseconds)"
          );
          process.exit(1);
        }
        const cooldownValue = parseInt(nextArg, 10);
        if (cooldownValue < 0) {
          console.error("Error: --cooldown must be 0 or greater");
          process.exit(1);
        }
        config.cooldownMs = cooldownValue;
        i++; // Skip next argument since we consumed it
        break;

      default:
        if (arg.startsWith("--")) {
          console.error(`Error: Unknown option '${arg}'`);
          console.error("Use --help to see available options");
          process.exit(1);
        }
    }
  }

  return config;
}

class LighthouseSitemapTester {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    this.results = [];
    this.violations = [];
  }

  /**
   * Calculate median value from an array of numbers
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate median metrics from multiple runs
   */
  calculateMedianMetrics(runs) {
    const metricKeys = ["TBT", "LCP", "CLS", "FCP", "SI"];
    const medianMetrics = {};

    metricKeys.forEach((key) => {
      const values = runs.map((run) => run.metrics[key]);
      let median = this.calculateMedian(values);

      // Round appropriately based on metric type
      if (key === "CLS") {
        median = parseFloat(median.toFixed(3));
      } else {
        median = Math.round(median);
      }

      medianMetrics[key] = median;
    });

    return medianMetrics;
  }

  /**
   * Calculate median Lighthouse score from multiple runs
   */
  calculateMedianLighthouseScore(runs) {
    const scores = runs.map((run) => run.lighthouseScore);
    return Math.round(this.calculateMedian(scores));
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
  checkViolations(url, metrics, runNumber = null) {
    const violations = [];

    Object.entries(this.config.thresholds).forEach(([metric, config]) => {
      const value = metrics[metric];
      const threshold = config.max;

      if (value > threshold) {
        const runInfo = runNumber ? ` (run ${runNumber})` : "";
        const violation = {
          url,
          metric,
          value,
          threshold,
          runNumber,
          message: `${metric} violation: ${value} > ${threshold}${runInfo}`,
        };

        violations.push(violation);

        // Handle violation based on configuration
        if (config.violationHandler === "console.error") {
          console.error(`❌ ${url}${runInfo} - ${violation.message}`);
        } else if (config.violationHandler === "console.log") {
          console.log(`⚠️  ${url}${runInfo} - ${violation.message}`);
        }
      }
    });

    return violations;
  }

  /**
   * Perform multiple runs for a single URL
   */
  async performMultipleRuns(url) {
    console.log(`🔍 Testing: ${url} (${this.config.runs} runs)`);

    const runs = [];

    for (let i = 1; i <= this.config.runs; i++) {
      try {
        console.log(`📊 Run ${i}/${this.config.runs}...`);

        const lighthouseResult = await this.runLighthouseTest(url);
        const metrics = this.extractMetrics(lighthouseResult);
        const violations = this.checkViolations(url, metrics, i);
        const lighthouseScore = Math.round(
          lighthouseResult.categories.performance.score * 100
        );

        runs.push({
          runNumber: i,
          metrics,
          violations,
          lighthouseScore,
          lighthouseResult,
        });

        // Add cooldown between runs (except for the last run)
        if (i < this.config.runs && this.config.cooldownMs > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.cooldownMs)
          );
        }
      } catch (error) {
        console.error(`💥 Failed run ${i} for ${url}: ${error.message}`);
        // Continue with remaining runs even if one fails
      }
    }

    if (runs.length === 0) {
      throw new Error(`All runs failed for ${url}`);
    }

    return runs;
  }

  /**
   * Save detailed results to JSON file
   */
  async saveResults(
    url,
    runs,
    medianMetrics,
    medianViolations,
    medianLighthouseScore
  ) {
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Create filename from URL
    const filename = url.replace(/[^a-zA-Z0-9]/g, "_") + "_lighthouse.json";
    const filepath = path.join(this.config.outputDir, filename);

    const result = {
      url,
      timestamp: new Date().toISOString(),
      totalRuns: runs.length,
      successfulRuns: runs.length,
      medianMetrics,
      medianViolations,
      medianLighthouseScore,
      passed: medianViolations.length === 0,
      calculator: `https://googlechrome.github.io/lighthouse/scorecalc/#FCP=${medianMetrics.FCP}&SI=${medianMetrics.SI}&LCP=${medianMetrics.LCP}&TBT=${medianMetrics.TBT}&CLS=${medianMetrics.CLS}&device=mobile&version=10`,
      individualRuns: runs.map((run) => ({
        runNumber: run.runNumber,
        metrics: run.metrics,
        violations: run.violations,
        lighthouseScore: run.lighthouseScore,
        passed: run.violations.length === 0,
      })),
      // Keep one raw Lighthouse result for reference (median run or first available)
      rawLighthouseData:
        runs[Math.floor(runs.length / 2)]?.lighthouseResult ||
        runs[0].lighthouseResult,
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
      runsPerUrl: this.config.runs,
      passedUrls: this.results.filter((r) => r.passed).length,
      failedUrls: this.results.filter((r) => !r.passed).length,
      totalViolations: this.violations.length,
      timestamp,
      results: this.results.map((r) => ({
        url: r.url,
        calculator: r.calculator,
        passed: r.passed,
        violationCount: r.medianViolations.length,
        medianLighthouseScore: r.medianLighthouseScore,
        medianMetrics: r.medianMetrics,
        totalRuns: r.totalRuns,
        successfulRuns: r.successfulRuns,
      })),
    };

    const summaryPath = path.join(this.config.outputDir, "summary.json");
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    const summaryPathAssets = path.join(
      "src/assets/lighthouse-sitemap-tester-results.json"
    );
    await fs.writeFile(summaryPathAssets, JSON.stringify(summary, null, 2));

    // Console summary
    console.log("\n📊 SUMMARY REPORT");
    console.log("=================");
    console.log(`Total URLs tested: ${summary.totalUrls}`);
    console.log(`Runs per URL: ${summary.runsPerUrl}`);
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
      console.log(`🔄 Runs per URL: ${this.config.runs}`);
      console.log(`⏱️  Cooldown: ${this.config.cooldownMs}ms`);
      console.log("");

      // Parse sitemap
      const urls = await this.parseSitemap(this.config.sitemapPath);
      console.log(`Found ${urls.length} URLs in sitemap\n`);

      // Test each URL
      for (const url of urls) {
        try {
          const runs = await this.performMultipleRuns(url);

          // Calculate median values
          const medianMetrics = this.calculateMedianMetrics(runs);
          const medianLighthouseScore =
            this.calculateMedianLighthouseScore(runs);
          const medianViolations = this.checkViolations(url, medianMetrics);

          // Save detailed results
          const result = await this.saveResults(
            url,
            runs,
            medianMetrics,
            medianViolations,
            medianLighthouseScore
          );

          this.results.push(result);
          this.violations.push(...medianViolations);

          // Console output for passed tests
          if (medianViolations.length === 0) {
            console.log(
              `✅ ${url} - All median metrics passed (${runs.length} runs)`
            );
          }

          console.log(
            `  📈 Median Lighthouse Score: ${medianLighthouseScore}/100`
          );
          console.log(
            `  📊 Median Metrics: TBT:${medianMetrics.TBT}ms, LCP:${medianMetrics.LCP}ms, CLS:${medianMetrics.CLS}, FCP:${medianMetrics.FCP}ms, SI:${medianMetrics.SI}ms\n`
          );
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
const config = parseArguments();
const tester = new LighthouseSitemapTester(config);
tester.run();
