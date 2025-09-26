// scripts/update-lighthouse-frontmatter.js
import fs from "fs";
import path from "path";

// Get results path from command line arguments or use default
const resultsPath =
  process.argv[2] || "./src/assets/lighthouse-sitemap-tester-results.json";
const mdxPath = "./src/content/blog/03.01 automated lighthouse.mdx";

// Check if results file exists
if (!fs.existsSync(resultsPath)) {
  console.error(`Error: Results file not found at ${resultsPath}`);
  process.exit(1);
}

// Check if MDX file exists
if (!fs.existsSync(mdxPath)) {
  console.error(`Error: MDX file not found at ${mdxPath}`);
  process.exit(1);
}

try {
  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  let mdxContent = fs.readFileSync(mdxPath, "utf8");

  // Update the updatedDate in frontmatter
  mdxContent = mdxContent.replace(
    /updatedDate: "[^"]*"/,
    `updatedDate: "${results.timestamp}"`
  );

  fs.writeFileSync(mdxPath, mdxContent);
  console.log(`✅ Updated frontmatter with timestamp: ${results.timestamp}`);
  console.log(`📄 Results from: ${resultsPath}`);
} catch (error) {
  console.error(`Error processing files: ${error.message}`);
  process.exit(1);
}
