import { expect, type Page, test } from "@playwright/test";

import en from "../../messages/en.json";
import zh from "../../messages/zh.json";
import { DEFAULT_DEMO_DATA } from "../../src/core/skin/demo/defaults";
import { VISUAL_TARGETS } from "../visual/pages";
import { NetworkTracker } from "../visual/support/network";
import { waitForPageReady } from "../visual/support/ready";
import { guardDemoPage } from "./guards";

async function expectRenderedPage(
  page: Page,
  locale: "en" | "zh",
  targetId: string
) {
  const main = page.getByRole("main").first();
  await expect(main).toBeVisible();
  const heading = main.getByRole("heading").first();
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText(/\S/u);

  switch (targetId) {
    case "sign-in":
      await expect(main.locator('input[type="email"]')).toBeVisible();
      await expect(main.locator('input[type="password"]')).toBeVisible();
      break;
    case "sign-up": {
      await expect(main.locator("#name, #sign-up-name")).toBeVisible();
      await expect(main.locator('input[type="email"]')).toBeVisible();
      const passwords = main.locator('input[type="password"]');
      await expect(passwords).toHaveCount(2);
      await expect(passwords.nth(0)).toBeVisible();
      await expect(passwords.nth(1)).toBeVisible();
      break;
    }
    case "forgot-password":
      await expect(main.locator('input[type="email"]')).toBeVisible();
      break;
    case "reset-password": {
      const passwords = main.locator('input[type="password"]');
      await expect(passwords).toHaveCount(2);
      await expect(passwords.nth(0)).toBeVisible();
      await expect(passwords.nth(1)).toBeVisible();
      break;
    }
    case "settings": {
      const copy = locale === "zh" ? zh : en;
      await expect(
        main.getByRole("textbox", {
          name: copy.Settings.general.name,
          exact: true,
        })
      ).toBeVisible();
      break;
    }
    case "settings-security":
      await expect(
        main.locator('input[type="password"]').first()
      ).toBeVisible();
      break;
    case "support-new":
      await expect(main.locator("#subject, #ticket-subject")).toBeVisible();
      await expect(main.locator("#message, #ticket-message")).toBeVisible();
      break;
  }
}

for (const locale of ["en", "zh"] as const) {
  for (const target of VISUAL_TARGETS) {
    test(`${locale} ${target.id}`, async ({ page }, testInfo) => {
      const theme = testInfo.project.metadata.theme as "light" | "dark";
      const healthy = await guardDemoPage(page, theme);
      const tracker = new NetworkTracker(page);
      const ticket = DEFAULT_DEMO_DATA.support.tickets[0];
      if (!ticket)
        throw new Error("Demo acceptance requires the default ticket");
      const route =
        target.id === "support-detail"
          ? `/dashboard/support/${ticket.id}`
          : target.path;
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      if (target.kind === "redirect") {
        await expect(page).toHaveURL(
          new RegExp(
            `/${locale}${target.expectedPath.replace(/[?]/gu, "\\?")}$`
          )
        );
      } else {
        if (target.settingsTab) {
          const copy = locale === "zh" ? zh : en;
          await page
            .getByRole("tab", {
              name: copy.Settings.tabs[target.settingsTab],
              exact: true,
            })
            .click();
          await expect(page.getByRole("tabpanel")).toBeVisible();
        }
        await expectRenderedPage(page, locale, target.id);
        await waitForPageReady(page, tracker, {
          requireHydrationMarker: false,
        });
        const brokenImages = await page.locator("img").evaluateAll((images) =>
          images
            .filter(
              (element): element is HTMLImageElement =>
                element instanceof HTMLImageElement
            )
            .filter((image) => image.getBoundingClientRect().width > 0)
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.getAttribute("src"))
        );
        expect(brokenImages).toEqual([]);
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${target.id}.png`),
          fullPage: true,
          animations: "disabled",
        });
        await testInfo.attach("demo-route-screenshot", {
          body: `${locale}-${target.id}`,
          contentType: "text/plain",
        });
      }
      await healthy();
    });
  }
}
