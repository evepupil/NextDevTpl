import path from "node:path";

import { defineConfig } from "@playwright/test";

import {
  VISUAL_BASE_URL,
  VISUAL_TIMEZONE,
  VISUAL_VIEWPORTS,
} from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { authNavigationProject } from "./auth-navigation/project";

const selected = authNavigationProject(REPO_ROOT);
const artifacts = path.join(
  REPO_ROOT,
  "artifacts/skins/palettes",
  path.basename(selected.directory)
);

export default defineConfig({
  testDir: __dirname,
  testMatch: "palette.spec.ts",
  globalSetup: "./auth-navigation/global-setup.ts",
  globalTeardown: "./auth-navigation/global-teardown.ts",
  outputDir: path.join(artifacts, "results"),
  forbidOnly: true,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(artifacts, "report") }],
  ],
  projects: Object.entries(VISUAL_VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: { viewport, isMobile: name === "mobile", hasTouch: name === "mobile" },
  })),
  use: {
    baseURL: VISUAL_BASE_URL,
    channel: "msedge",
    headless: true,
    locale: "en-US",
    timezoneId: VISUAL_TIMEZONE,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    storageState: { cookies: [], origins: [] },
  },
});
