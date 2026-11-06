import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import english from "../../messages/en.json";
import chinese from "../../messages/zh.json";
import { VISUAL_LOCALES, type VisualTheme } from "../visual/constants";
import {
  AUTH_STATE_FILE,
  REPO_ROOT,
  SCREENSHOT_STYLE_FILE,
} from "../visual/paths";
import { waitForPageReady } from "../visual/support/ready";
import { preparePage } from "../visual/support/visit";
import { skinAcceptanceProject } from "./project";
import { skinTargets } from "./targets";

const screenshotStyle = readFileSync(SCREENSHOT_STYLE_FILE, "utf8");

const targets = skinTargets(skinAcceptanceProject(REPO_ROOT).modules);

for (const locale of VISUAL_LOCALES) {
  for (const authenticated of [false, true]) {
    test.describe(`${locale} ${authenticated ? "已登录" : "未登录"}`, () => {
      test.use({
        locale: locale === "zh" ? "zh-CN" : "en-US",
        storageState: authenticated
          ? AUTH_STATE_FILE
          : { cookies: [], origins: [] },
      });

      for (const { target, view } of targets.filter(
        (item) => item.target.auth === authenticated
      )) {
        test(`${locale}-${target.id}`, async ({ page }, testInfo) => {
          const theme = testInfo.project.metadata.theme as VisualTheme;
          const prepared = await preparePage(page, theme);
          const response = await page.goto(`/${locale}${target.path}`, {
            waitUntil: "domcontentloaded",
          });
          expect(response).not.toBeNull();
          expect(response?.status()).toBeLessThan(400);
          const expected = new URL(
            `/${locale}${target.kind === "redirect" ? target.expectedPath : target.path}`,
            page.url()
          );
          await expect(page).toHaveURL(
            (url) =>
              url.pathname.replace(/\/+$/, "") ===
                expected.pathname.replace(/\/+$/, "") &&
              url.search === expected.search
          );
          await waitForPageReady(page, prepared.tracker);
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.locator("html")).toHaveClass(
            new RegExp(`\\b${theme}\\b`)
          );
          expect((await page.title()).trim().length).toBeGreaterThan(0);

          await expect(
            page.locator('[data-skin="contrast"]').first()
          ).toBeVisible();
          const main =
            target.id === "docs-header"
              ? page.getByRole("article")
              : page.getByRole("main").first();
          await expect(main).toBeVisible();
          await expect(
            page.getByRole("heading", { level: 1 }).first()
          ).toBeVisible();
          await expect(
            page.locator(`[data-skin-view="${view}"]`).first()
          ).toBeVisible();
          const messages = locale === "zh" ? chinese : english;
          const headings: Record<string, string> = {
            dashboard: messages.Dashboard.pages.dashboard,
            "sign-in": messages.Auth.signIn.title,
            "sign-up": messages.Auth.signUp.title,
            "forgot-password": locale === "zh" ? "忘记密码" : "Forgot password",
            "reset-password": messages.Auth.resetPassword.title,
            settings: messages.Dashboard.pages.settings,
            "settings-security": messages.Dashboard.pages.settings,
            "settings-billing": messages.Dashboard.pages.settings,
            "settings-usage": messages.Dashboard.pages.settings,
            credits: messages.Dashboard.pages.settings,
            "credits-buy": messages.Dashboard.pages.settings,
            "support-list": messages.Support.pages.title,
            "support-new": messages.Support.pages.newTitle,
          };
          if (headings[target.id]) {
            await expect(page.getByRole("heading", { level: 1 })).toHaveText(
              headings[target.id]!
            );
          }
          if (view === "shared.empty-dashboard") {
            await expect(page.locator("[data-locale]").first()).toHaveAttribute(
              "data-locale",
              locale
            );
            await expect(
              main.getByText(
                locale === "zh"
                  ? "工作区摘要将在可用时显示在这里。"
                  : "Your workspace summary will appear here when available.",
                { exact: true }
              )
            ).toBeVisible();
          }
          if (target.id === "home") {
            await expect(
              main.getByText(messages.Hero.subtitle, { exact: true })
            ).toBeVisible();
          }
          if (target.id === "support-detail") {
            await expect(
              main.getByRole("heading", {
                name: messages.Support.pages.conversation,
                exact: true,
              })
            ).toBeVisible();
          }
          if (target.id === "docs-header") {
            await expect(
              page.locator('[data-skin-view="marketing.header"]')
            ).toBeVisible();
          } else {
            const layout =
              target.group === "marketing"
                ? "marketing.layout"
                : target.group === "auth"
                  ? "auth.layout"
                  : "shared.dashboard-layout";
            await expect(
              page.locator(`[data-skin-view="${layout}"]`)
            ).toBeVisible();
          }
          const localized = page.locator("[data-locale]");
          if (
            ["blog", "pseo", "marketing"].some((module) =>
              view.startsWith(`${module}.`)
            ) &&
            target.id !== "docs-header"
          ) {
            await expect(localized.first()).toBeVisible();
          }
          for (const element of await localized.all()) {
            await expect(element).toHaveAttribute("data-locale", locale);
          }
          if (target.kind === "screenshot" && target.settingsTab) {
            const tab = page.locator(
              `[role="tab"][id$="-trigger-${target.settingsTab}"]`
            );
            if ((await tab.count()) > 0) {
              await tab.click();
              await expect(tab).toHaveAttribute("data-state", "active");
            } else {
              await expect(
                page.locator(`[data-section="${target.settingsTab}"]`)
              ).toBeVisible();
            }
          }

          await waitForPageReady(page, prepared.tracker);
          await prepared.guards.assertHealthy("替换皮肤渲染完成");
          const dimensions = await page.evaluate(() => ({
            content: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
          }));
          expect(dimensions.content).toBeLessThanOrEqual(
            dimensions.viewport + 1
          );
          expect(
            await page
              .locator("img")
              .evaluateAll((images) =>
                images.every(
                  (image) =>
                    image instanceof HTMLImageElement &&
                    image.complete &&
                    image.naturalWidth > 0
                )
              )
          ).toBe(true);
          const brand = page
            .getByRole("img", { name: "NextDevTpl", exact: true })
            .first();
          await expect(brand).toBeVisible();
          await expect(brand).toHaveAttribute("src", /brand.*\.svg/);

          if (target.kind === "screenshot") {
            const screenshotPath = testInfo.outputPath("view.png");
            await page.screenshot({
              path: screenshotPath,
              fullPage: true,
              animations: "disabled",
              caret: "hide",
              style: screenshotStyle,
            });
            await testInfo.attach("view", {
              path: screenshotPath,
              contentType: "image/png",
            });
          }
          await prepared.guards.assertHealthy("替换皮肤截图完成");
        });
      }
    });
  }
}
