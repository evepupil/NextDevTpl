import path from "node:path";

import { defineConfig } from "@playwright/test";

import { VISUAL_BASE_URL, VISUAL_VIEWPORTS } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import {
  BASE_CONTEXT_OPTIONS,
  BROWSER_LAUNCH_ARGS,
} from "../visual/support/context";
import { skinAcceptanceProject } from "./project";

const selected = skinAcceptanceProject(REPO_ROOT);
const artifacts = path.join(
  REPO_ROOT,
  "artifacts",
  "skins",
  "contrast",
  path.basename(selected.directory)
);
const renderProjects = Object.entries(VISUAL_VIEWPORTS).flatMap(
  ([device, viewport]) =>
    (["light", "dark"] as const).map((theme) => ({
      name: `${device}-${theme}`,
      testMatch: "skin.spec.ts",
      metadata: { device, theme },
      use: {
        ...BASE_CONTEXT_OPTIONS,
        channel: "msedge",
        headless: true,
        viewport,
        colorScheme: theme,
        hasTouch: device === "mobile",
        isMobile: device === "mobile",
        launchOptions: { args: [...BROWSER_LAUNCH_ARGS] },
      },
    }))
);

export default defineConfig({
  testDir: __dirname,
  testMatch: ["skin.spec.ts", "workflows.spec.ts"],
  outputDir: path.join(artifacts, "results"),
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  forbidOnly: true,
  fullyParallel: true,
  retries: 0,
  timeout: 120_000,
  globalTimeout: 30 * 60_000,
  workers: 4,
  expect: { timeout: 30_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(artifacts, "report") }],
  ],
  projects: [
    ...renderProjects,
    {
      name: "workflows",
      testMatch: "workflows.spec.ts",
      dependencies: renderProjects.map((project) => project.name),
      use: {
        ...BASE_CONTEXT_OPTIONS,
        channel: "msedge",
        headless: true,
        viewport: VISUAL_VIEWPORTS.desktop,
        launchOptions: { args: [...BROWSER_LAUNCH_ARGS] },
      },
    },
  ],
  use: {
    baseURL: VISUAL_BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
});
