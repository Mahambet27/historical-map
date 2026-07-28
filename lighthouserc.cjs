module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4174",
      startServerReadyPattern: "Local",
      startServerReadyTimeout: 120000,
      url: ["http://127.0.0.1:4174/", "http://127.0.0.1:4174/map"],
      numberOfRuns: 1,
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: "filesystem", outputDir: "./docs/optimization/lighthouse" },
  },
};
