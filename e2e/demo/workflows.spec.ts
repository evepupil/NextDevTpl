import { expect, type Locator, type Page, test } from "@playwright/test";

import en from "../../messages/en.json";
import zh from "../../messages/zh.json";
import { DEFAULT_DEMO_DATA } from "../../src/core/skin/demo/defaults";
import {
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_KEY,
} from "../../src/lib/cookie-consent";
import { guardDemoPage } from "./guards";

const ALLOWED_LOCAL_STORAGE_KEYS: ReadonlySet<string> = new Set([
  "theme",
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_KEY,
]);

async function softLink(page: Page, href: string) {
  const destination = page.locator(`a[href="${href}"]`);
  const accessibleDestination = page.getByRole("link").and(destination);
  await expect(destination.first()).toBeAttached();
  let link = accessibleDestination.first();
  if (!(await link.isVisible())) {
    const mobileMenu = page
      .locator("main > div > header button:visible")
      .first();
    await mobileMenu.click();
    const navigationDialog = page.getByRole("dialog").first();
    link =
      (await navigationDialog.count()) > 0
        ? navigationDialog.getByRole("link").and(destination).first()
        : accessibleDestination.first();
  }
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(
    (url) => `${url.pathname}${url.search}` === href
  );
}

async function expectMainActionInViewport(page: Page, action: Locator) {
  await expect(action).toBeVisible();
  await expect(action).toBeInViewport({ ratio: 1 });

  const mainBox = await page.getByRole("main").first().boundingBox();
  const actionBox = await action.boundingBox();
  if (!mainBox || !actionBox) {
    throw new Error("Subscription action must have a visible layout box");
  }

  expect(actionBox.x).toBeGreaterThanOrEqual(mainBox.x);
  expect(actionBox.y).toBeGreaterThanOrEqual(mainBox.y);
  expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
    mainBox.x + mainBox.width + 1
  );
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(
    mainBox.y + mainBox.height + 1
  );
}

test("资料、工单和语言切换保留本地状态，刷新恢复样例", async ({
  page,
}, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/sign-in");
  await page.locator('input[type="email"]').fill("demo@example.test");
  await page.locator('input[type="password"]').fill("Demo-Password-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await softLink(page, "/en/dashboard/settings");
  const name = "Taylor Demo Acceptance";
  const nameInput = page.getByRole("textbox", {
    name: en.Settings.general.name,
    exact: true,
  });
  await nameInput.fill(name);
  await page
    .getByRole("button", { name: en.Settings.general.save, exact: true })
    .click();
  await expect(nameInput).toHaveValue(name);
  await softLink(page, "/en/dashboard/support");
  await softLink(page, "/en/dashboard/support/new");
  const subject = "Local demo acceptance request";
  const message = "A ticket created without a server or provider request.";
  const reply = "A reply preserved through navigation in the same browser tab.";
  await page.locator("#subject, #ticket-subject").fill(subject);
  await page.locator("#message, #ticket-message").fill(message);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/dashboard\/support\/(?!new$)[^/?]+$/);
  const ticketPath = new URL(page.url()).pathname;
  await expect(
    page.getByRole("heading", { name: subject, exact: true })
  ).toBeVisible();
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await page.locator("textarea").fill(reply);
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await expect(page.locator("textarea")).toHaveValue("");
  await page.screenshot({
    path: testInfo.outputPath("local-ticket-reply.png"),
    fullPage: true,
    animations: "disabled",
  });
  await softLink(page, "/en/dashboard/support");
  await page.getByRole("link", { name: subject }).click();
  await expect(page).toHaveURL((url) => url.pathname === ticketPath);
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  await softLink(page, "/en/dashboard/settings");
  await expect(nameInput).toHaveValue(name);

  const language = page.locator("#settings-language");
  if (await language.count()) {
    await language.selectOption("zh");
  } else {
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /中文/u }).click();
  }
  await expect(page).toHaveURL(/\/zh\/dashboard\/settings$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(
    page.getByRole("textbox", { name: zh.Settings.general.name, exact: true })
  ).toHaveValue(name);
  await softLink(page, "/zh/dashboard/support");
  await page.getByRole("link", { name: subject }).click();
  await expect(page.getByText(reply, { exact: true })).toBeVisible();
  const persisted = await page.evaluate(() => ({
    localStorage: Object.keys(localStorage)
      .sort()
      .map((key) => ({ key, value: localStorage.getItem(key) })),
    sessionStorage: Object.keys(sessionStorage)
      .sort()
      .map((key) => ({ key, value: sessionStorage.getItem(key) })),
    cookies: document.cookie,
  }));
  const localStorageKeys = persisted.localStorage.map(({ key }) => key);
  expect(localStorageKeys).toContain("theme");
  expect(
    localStorageKeys.filter((key) => !ALLOWED_LOCAL_STORAGE_KEYS.has(key))
  ).toEqual([]);
  expect(persisted.sessionStorage).toEqual([]);
  const persistedValues = JSON.stringify(persisted);
  expect(persistedValues).not.toContain(name);
  expect(persistedValues).not.toContain(DEFAULT_DEMO_DATA.workspace.user.email);
  expect(persistedValues).not.toContain(subject);
  expect(persistedValues).not.toContain(message);
  expect(persistedValues).not.toContain(reply);
  expect(persistedValues).not.toContain("Demo-Password-2026");
  await page.reload();
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await page.goto("/en/dashboard/settings");
  await expect(nameInput).toHaveValue(DEFAULT_DEMO_DATA.workspace.user.name);
  await healthy();
});

test("取消与恢复订阅即时更新账单，刷新后复位", async ({ page }, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/dashboard/settings");
  await page
    .getByRole("tab", { name: en.Settings.tabs.billing, exact: true })
    .click();
  const copy = en.Settings.billing.currentPlan;
  const cancelButton = page.getByRole("button", {
    name: copy.cancelSubscription,
    exact: true,
  });
  await expectMainActionInViewport(page, cancelButton);
  await cancelButton.click();
  const dialog = page
    .getByRole("alertdialog", {
      name: copy.cancelDialog.title,
      exact: true,
    })
    .or(
      page.getByRole("dialog", {
        name: copy.cancelDialog.title,
        exact: true,
      })
    );
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: copy.cancelDialog.confirm, exact: true })
    .click();
  const resumeButton = page.getByRole("button", {
    name: copy.resumeSubscription,
    exact: true,
  });
  await expectMainActionInViewport(page, resumeButton);
  await page.screenshot({
    path: testInfo.outputPath("subscription-canceled.png"),
    fullPage: true,
    animations: "disabled",
  });
  await resumeButton.click();
  await expectMainActionInViewport(page, cancelButton);
  await page.reload();
  await page
    .getByRole("tab", { name: en.Settings.tabs.billing, exact: true })
    .click();
  await expectMainActionInViewport(page, cancelButton);
  await healthy();
});
