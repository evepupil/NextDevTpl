import path from "node:path";

import { defineConfig } from "@playwright/test";

import { VISUAL_BASE_URL, VISUAL_VIEWPORTS } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { authNavigationProject } from "./auth-navigation/project";

const project = authNavigationProject(REPO_ROOT);
const artifacts = path.join(
  REPO_ROOT,
  "artifacts",
  "skins",
  "auth-navigation",
  path.basename(project.directory)
);
const browserProjects = Object.entries(VISUAL_VIEWPORTS).map(
  ([device, viewport]) => ({
    name: device,
    use: {
      hasTouch: device === "mobile",
      isMobile: device === "mobile",
      viewport,
    },
  })
);

export default defineConfig({
  testDir: __dirname,
  testMatch: "auth-navigation.spec.ts",
  outputDir: path.join(artifacts, "results"),
  globalSetup: "./auth-navigation/global-setup.ts",
  globalTeardown: "./auth-navigation/global-teardown.ts",
  forbidOnly: true,
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  globalTimeout: 20 * 60_000,
  workers: 1,
  expect: { timeout: 30_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(artifacts, "report") }],
  ],
  projects: browserProjects,
  use: {
    baseURL: VISUAL_BASE_URL,
    channel: "msedge",
    headless: true,
    locale: "en-US",
    screenshot: "only-on-failure",
    storageState: { cookies: [], origins: [] },
    timezoneId: "UTC",
    trace: "retain-on-failure",
    video: "off",
  },
});
