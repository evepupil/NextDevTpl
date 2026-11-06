/**
 * 截图基线的 Playwright 配置
 *
 * 用法（见 package.json）：
 * - `pnpm visual:baseline`：重拍全部基线，并重新生成 baseline-manifest.json
 * - `pnpm visual:check`：和基线逐像素对比，有差异就失败，并产出 HTML 报告
 *
 * 所有输出都放进 artifacts/visual/（已被 .gitignore 忽略）：
 *   baseline/<项目名>/<语言>-<页面编号>.png   基线图片
 *   results/                                   失败时的实际图、差异图
 *   report/                                    HTML 报告
 */

import { defineConfig } from "@playwright/test";

import {
  VISUAL_BASE_URL,
  VISUAL_VIEWPORTS,
  type VisualDevice,
  type VisualTheme,
} from "./constants";
import { BASELINE_DIR, REPORT_DIR, RESULTS_DIR, VISUAL_DIR } from "./paths";
import { BASE_CONTEXT_OPTIONS, BROWSER_LAUNCH_ARGS } from "./support/context";

/** 4 个变体 = 2 种尺寸 × 2 种主题；项目名同时是基线子目录名 */
const VARIANTS: ReadonlyArray<{ device: VisualDevice; theme: VisualTheme }> = [
  { device: "desktop", theme: "light" },
  { device: "desktop", theme: "dark" },
  { device: "mobile", theme: "light" },
  { device: "mobile", theme: "dark" },
];

/** 并发数：页面都由同一个开发服务器渲染，开太多会让首次编译互相抢资源 */
const WORKERS = Number(process.env.VISUAL_WORKERS ?? 4);

export default defineConfig({
  expect: {
    // 逐像素严格比较：不允许任何色差，不允许任何不同的像素
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0 },
    timeout: 30_000,
  },
  forbidOnly: true,
  fullyParallel: true,
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  // 不重试：时好时坏的页面要找到原因，而不是靠重试蒙混过关
  retries: 0,
  globalTimeout: 45 * 60_000,
  outputDir: RESULTS_DIR,
  projects: VARIANTS.map(({ device, theme }) => ({
    metadata: { device, theme },
    name: `${device}-${theme}`,
    use: {
      ...BASE_CONTEXT_OPTIONS,
      channel: "msedge",
      colorScheme: theme,
      hasTouch: device === "mobile",
      headless: true,
      isMobile: device === "mobile",
      launchOptions: { args: [...BROWSER_LAUNCH_ARGS] },
      viewport: VISUAL_VIEWPORTS[device],
    },
  })),
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: REPORT_DIR }],
    ["./manifest-reporter.ts"],
  ],
  snapshotDir: BASELINE_DIR,
  snapshotPathTemplate: "{snapshotDir}/{projectName}/{arg}{ext}",
  testDir: VISUAL_DIR,
  testMatch: "visual.spec.ts",
  timeout: 120_000,
  use: {
    baseURL: VISUAL_BASE_URL,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  workers: WORKERS,
});
