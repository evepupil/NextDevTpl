import path from "node:path";
import { defineConfig } from "@playwright/test";

import { VISUAL_BASE_URL, VISUAL_VIEWPORTS } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { demoProject } from "./project";

const selected = demoProject();
const artifacts = path.join(
  REPO_ROOT,
  "artifacts/demo",
  path.basename(selected.directory)
);

export default defineConfig({
  testDir: __dirname,
  testMatch: "*.spec.ts",
  globalSetup: "./global-setup.ts",
  outputDir: path.join(artifacts, "results"),
  forbidOnly: true,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(artifacts, "report") }],
    [
      "./screenshot-reporter.ts",
      { outputFile: path.join(artifacts, "screenshot-receipt.json") },
    ],
  ],
  projects: Object.entries(VISUAL_VIEWPORTS).flatMap(([device, viewport]) =>
    (["light", "dark"] as const).map((theme) => ({
      name: `${device}-${theme}`,
      metadata: { device, theme },
      use: {
        viewport,
        colorScheme: theme,
        isMobile: device === "mobile",
        hasTouch: device === "mobile",
      },
    }))
  ),
  use: {
    baseURL: VISUAL_BASE_URL,
    channel: "msedge",
    headless: true,
    locale: "en-US",
    timezoneId: "UTC",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    storageState: { cookies: [], origins: [] },
  },
});
