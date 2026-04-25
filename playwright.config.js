const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./src/test/e2e",
  timeout: 30000,
  fullyParallel: false,
  reporter: "list",
  use: {
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --config vite.renderer.config.mjs --host 127.0.0.1 --port 5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    url: "http://127.0.0.1:5173",
  },
  workers: 1,
});
