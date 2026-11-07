import { expect, test } from "@playwright/test";

import en from "../../messages/en.json";
import { DEFAULT_DEMO_DATA } from "../../src/core/skin/demo/defaults";
import { guardDemoPage } from "./guards";

test("注册校验并通过账号菜单退出", async ({ page }, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/sign-up");
  await page.locator("#name, #sign-up-name").fill("Demo Registration");
  await page.locator('input[type="email"]').fill("registration@example.test");
  const passwords = page.locator('input[type="password"]');
  await passwords.nth(0).fill("Demo-Password-2026");
  await passwords.nth(1).fill("Different-Password-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByText(en.Auth.signUp.errors.passwordMismatch, { exact: true })
  ).toBeVisible();
  await passwords.nth(1).fill("Demo-Password-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  const userNames = page.getByText(DEFAULT_DEMO_DATA.workspace.user.name, {
    exact: true,
  });
  await expect(userNames.first()).toBeAttached();
  const userName = userNames.filter({ visible: true });
  if (!(await userName.first().isVisible())) {
    await page.locator("main > div > header button:visible").first().click();
  }
  await expect(userName.first()).toBeVisible();
  const accountButtonName = new RegExp(DEFAULT_DEMO_DATA.workspace.user.name);
  const mobileSheet = page.getByRole("dialog");
  const accountTrigger =
    (await mobileSheet.count()) > 0
      ? mobileSheet.getByRole("button", { name: accountButtonName }).first()
      : page
          .getByRole("button", { name: accountButtonName })
          .filter({ visible: true })
          .first();
  await expect(accountTrigger).toBeInViewport();
  await accountTrigger.click();
  await expect(accountTrigger).toHaveAttribute("aria-expanded", "true");
  const accountPopupId = await accountTrigger.getAttribute("aria-controls");
  if (accountPopupId) {
    const accountPopup = page.locator(`[id="${accountPopupId}"]`);
    const logoutButton = accountPopup.getByRole("button", {
      name: en.Dashboard.sidebar.logout,
      exact: true,
    });
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeInViewport();
    await expect(
      page.getByRole("button", {
        name: en.Dashboard.sidebar.logout,
        exact: true,
      })
    ).toHaveCount(1);
    await page.screenshot({
      path: testInfo.outputPath("account-menu-open.png"),
      animations: "disabled",
    });
    await logoutButton.click();
  } else {
    const popupRole = await accountTrigger.getAttribute("aria-haspopup");
    expect(popupRole).toBe("menu");
    const menu = page.getByRole("menu");
    const logoutItem = menu.getByRole("menuitem", {
      name: en.Dashboard.sidebar.logout,
      exact: true,
    });
    await expect(logoutItem).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("account-menu-open.png"),
      animations: "disabled",
    });
    await logoutItem.click();
  }
  await expect(page).toHaveURL(/\/en\/sign-in$/);
  await healthy();
});

test("找回和重置密码展示本地结果，缺少凭据时保留错误界面", async ({
  page,
}, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/forgot-password");
  await page.locator('input[type="email"]').fill("reset@example.test");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByRole("heading", {
      name: /^(?:Check your email|Email sent)$/u,
    })
  ).toBeVisible();
  await expect(
    page.getByText("reset@example.test", { exact: true })
  ).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await page.goto("/en/reset-password");
  await expect(
    page.getByText(en.Auth.resetPassword.invalidLink, { exact: true })
  ).toBeVisible();
  await page.goto("/en/reset-password?token=local-demo-token");
  await page
    .locator('input[type="password"]')
    .nth(0)
    .fill("Demo-Password-2026");
  await page
    .locator('input[type="password"]')
    .nth(1)
    .fill("Different-Password-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByText(en.Auth.resetPassword.passwordMismatch, { exact: true })
  ).toBeVisible();
  await page
    .locator('input[type="password"]')
    .nth(1)
    .fill("Demo-Password-2026");
  await page.locator('form button[type="submit"]').click();
  await expect(
    page.getByRole("heading", {
      name: en.Auth.resetPassword.successTitle,
      exact: true,
    })
  ).toBeVisible();
  await healthy();
});

test("头像本地预览可保存，刷新后恢复初始头像", async ({ page }, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/dashboard/settings");
  await page.locator('input[type="file"]').setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
      "base64"
    ),
  });
  const accountMain = page.getByRole("main").first();
  await expect(accountMain.locator('img[src^="blob:"]').first()).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("avatar-preview.png"),
    animations: "disabled",
  });
  await page.reload();
  await expect(accountMain.locator('img[src^="blob:"]')).toHaveCount(0);
  await healthy();
});

test("年付购买直接更新同标签页的套餐和账单金额", async ({ page }, testInfo) => {
  const healthy = await guardDemoPage(
    page,
    testInfo.project.metadata.theme as "light" | "dark"
  );
  await page.goto("/en/#pricing");
  const toggle = page.locator("#billing-toggle");
  if (await toggle.count()) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  } else {
    const yearly = page
      .locator("#pricing")
      .getByRole("button", { name: new RegExp(en.Pricing.yearly) });
    await yearly.click();
    await expect(yearly).toHaveAttribute("aria-pressed", "true");
  }
  const proCard = page
    .locator('#pricing article, #pricing [data-slot="card"]')
    .filter({
      has: page.getByText(en.Pricing.plans.pro.name, { exact: true }),
    });
  await expect(proCard).not.toContainText(en.Pricing.currentPlan);
  await proCard.getByRole("button").click();
  await expect(proCard).toContainText(en.Pricing.currentPlan);
  const card = page
    .locator('#pricing article, #pricing [data-slot="card"]')
    .filter({
      has: page.getByText(en.Pricing.plans.ultra.name, { exact: true }),
    });
  await expect(card).toHaveCount(1);
  await card.getByRole("button").click();
  await expect(card).toContainText(en.Pricing.currentPlan);
  await card.getByRole("button").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/settings$/);
  await page
    .getByRole("tab", { name: en.Settings.tabs.billing, exact: true })
    .click();
  await expect(page.getByRole("tabpanel")).toContainText("Ultra");
  await expect(page.getByRole("tabpanel")).toContainText("$109");
  await page.screenshot({
    path: testInfo.outputPath("yearly-plan-billing.png"),
    fullPage: true,
    animations: "disabled",
  });
  await healthy();
});
