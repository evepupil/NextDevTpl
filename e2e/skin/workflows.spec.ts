import { expect, test } from "@playwright/test";

import messages from "../../messages/en.json";
import chinese from "../../messages/zh.json";
import { VISUAL_USER } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { waitForPageReady } from "../visual/support/ready";
import { preparePage } from "../visual/support/visit";
import { skinAcceptanceProject } from "./project";

const { modules } = skinAcceptanceProject(REPO_ROOT);

test.use({ storageState: { cookies: [], origins: [] }, locale: "en-US" });

test("替换皮肤中的登录、资料保存和工单往来", async ({ page }) => {
  test.skip(
    ["auth", "dashboard", "settings", "support"].some(
      (module) => !modules.includes(module)
    ),
    "此流程验收同时包含认证、控制台、设置和工单的组合"
  );
  const prepared = await preparePage(page, "light");
  await page.goto("/en/sign-in");
  await waitForPageReady(page, prepared.tracker);
  await page.locator("#sign-in-email").fill(VISUAL_USER.email);
  await page.locator("#sign-in-password").fill("incorrect-skin-test-password");

  // 只延后真实请求，保留真实认证结果，以便观察提交中的按钮状态。
  await page.route("**/api/auth/sign-in/email", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  const submit = page.locator('form button[type="submit"]');
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(
    page.locator('[data-skin-view="auth.sign-in"]').getByRole("alert")
  ).toContainText(/invalid|incorrect/i);
  await expect(submit).toBeEnabled();
  await expect(page).toHaveURL(/\/en\/sign-in$/);
  await test.info().attach("login-error", {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });

  await page.locator("#sign-in-password").fill(VISUAL_USER.password);
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page.unroute("**/api/auth/sign-in/email");
  await waitForPageReady(page, prepared.tracker);
  await expect(page.locator('[data-skin="contrast"]').first()).toBeVisible();

  if (modules.includes("settings")) {
    await page.goto("/en/dashboard/settings");
    await waitForPageReady(page, prepared.tracker);
    const name = "Alex Skin Acceptance";
    await page.locator("#settings-name").fill(name);
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/en/dashboard/settings" &&
        response.request().headers()["next-action"] !== undefined
    );
    await page
      .locator('[data-section="account"] form button[type="submit"]')
      .click();
    expect((await saved).ok()).toBe(true);
    await expect(page.getByText("资料更新成功", { exact: true })).toBeVisible();
    await page.reload();
    await waitForPageReady(page, prepared.tracker);
    await expect(page.locator("#settings-name")).toHaveValue(name);
  }

  if (modules.includes("support")) {
    const subject = "Skin acceptance support request";
    const message =
      "The replacement view submits this ticket through the shared service.";
    const reply =
      "A reply submitted through the replacement conversation view.";
    await page.goto("/en/dashboard/support/new");
    await waitForPageReady(page, prepared.tracker);
    await page.locator("#ticket-subject").fill(subject);
    await page.locator("#ticket-message").fill(message);
    await page.locator("#ticket-category").selectOption("technical");
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/en\/dashboard\/support\/(?!new$)[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(subject);
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await page.locator("#reply-content").fill(reply);
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
    await test.info().attach("ticket-reply", {
      body: await page.screenshot({ fullPage: true, animations: "disabled" }),
      contentType: "image/png",
    });
    await expect(page.locator("#reply-content")).toHaveValue("");
    await page.reload();
    await waitForPageReady(page, prepared.tracker);
    await expect(page.getByText(reply, { exact: true })).toBeVisible();
  }
  await page.locator('header button[aria-haspopup="menu"]').click();
  await page
    .getByRole("menuitem", {
      name: messages.Dashboard.sidebar.logout,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL((url) =>
    modules.includes("marketing")
      ? /\/en\/?$/.test(url.pathname)
      : /\/en\/sign-in$/.test(url.pathname)
  );
  await page.goto("/en/dashboard");
  await expect(page).toHaveURL(/\/en\/sign-in(?:\?.*)?$/);
  await expect(page.locator("#sign-in-email")).toBeVisible();
  if (modules.includes("marketing")) {
    await page.goto("/en");
    await waitForPageReady(page, prepared.tracker);
    const header = page.locator('[data-skin-view="marketing.header"]');
    await header
      .getByRole("button", { name: messages.Theme.darkMode, exact: true })
      .click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await header
      .getByRole("button", { name: messages.Theme.lightMode, exact: true })
      .click();
    await expect(page.locator("html")).toHaveClass(/\blight\b/);

    await header
      .getByRole("button", {
        name: messages.Cookie.managePreferences,
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await test.info().attach("cookie-preferences", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await dialog
      .getByRole("button", { name: messages.Cookie.rejectAll, exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await header
      .getByRole("button", {
        name: messages.Cookie.managePreferences,
        exact: true,
      })
      .click();
    const optional = dialog.locator('[role="switch"]:not(:disabled)');
    await expect(optional).toHaveCount(2);
    await expect(optional.nth(0)).toHaveAttribute("aria-checked", "false");
    await expect(optional.nth(1)).toHaveAttribute("aria-checked", "false");
    await dialog
      .getByRole("button", { name: messages.Cookie.rejectAll, exact: true })
      .click();

    await header.getByRole("button", { name: "切换语言", exact: true }).click();
    await page.getByRole("menuitem", { name: /中文/ }).click();
    await expect(page).toHaveURL(/\/zh\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");
    await expect(
      page.getByText(chinese.Hero.subtitle, { exact: true })
    ).toBeVisible();
  }
  await prepared.guards.assertHealthy("替换皮肤业务流程完成");
});
