/**
 * 页面截图用例
 *
 * 4 个 Playwright 项目（电脑 / 手机 × 浅色 / 深色）× 2 种语言 × 全部目标页面。
 * 截图页面逐张对比基线；重定向页面只校验最终网址，不截图。
 *
 * 用例里一律不用遮罩来掩盖不稳定：页面不稳定就要找到原因把它固定住（见 support/ready.ts）。
 */

import { expect, test } from "@playwright/test";

import {
  VISUAL_LOCALES,
  type VisualLocale,
  type VisualTheme,
} from "./constants";
import { VISUAL_TARGETS } from "./pages";
import { AUTH_STATE_FILE, SCREENSHOT_STYLE_FILE } from "./paths";
import {
  openRedirectTarget,
  openScreenshotTarget,
  preparePage,
} from "./support/visit";

/** 浏览器的语言设置，和网址里的语言前缀保持一致 */
const BROWSER_LOCALE: Record<VisualLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

/** 未登录状态：没有任何 Cookie 和本地存储 */
const ANONYMOUS_STATE = { cookies: [], origins: [] };

for (const locale of VISUAL_LOCALES) {
  for (const authenticated of [false, true]) {
    const targets = VISUAL_TARGETS.filter(
      (target) => target.auth === authenticated
    );

    test.describe(`${locale} ${authenticated ? "已登录" : "未登录"}`, () => {
      test.use({
        locale: BROWSER_LOCALE[locale],
        storageState: authenticated ? AUTH_STATE_FILE : ANONYMOUS_STATE,
      });

      for (const target of targets) {
        test(`${locale}-${target.id}`, async ({ page }, testInfo) => {
          const theme = testInfo.project.metadata.theme as VisualTheme;
          const prepared = await preparePage(page, theme);

          if (target.kind === "redirect") {
            await openRedirectTarget(prepared, target, locale);
            await prepared.guards.assertHealthy("重定向完成后");
            return;
          }

          await openScreenshotTarget(prepared, target, locale);
          // 先确认页面是好的再拍：基线更新模式下截图会被直接写成基线
          await prepared.guards.assertHealthy("截图前");

          await expect(page).toHaveScreenshot(`${locale}-${target.id}.png`, {
            animations: "disabled",
            caret: "hide",
            fullPage: true,
            stylePath: SCREENSHOT_STYLE_FILE,
          });

          await prepared.guards.assertHealthy("截图后");
          const consoleErrors = prepared.guards.getConsoleErrors();
          if (consoleErrors.length > 0) {
            testInfo.annotations.push({
              description: consoleErrors.join("\n"),
              type: "console-error",
            });
          }
        });
      }
    });
  }
}
