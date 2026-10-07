import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4177",
    launchOptions: { executablePath: process.env.SCROLLPLUS_CHROME_EXECUTABLE },
  },
  webServer: {
    command: "python3 -m http.server 4177 --directory dist-fixture",
    port: 4177,
    reuseExistingServer: true,
  },
});
