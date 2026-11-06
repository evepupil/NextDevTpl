import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";

import messages from "../../messages/en.json";
import { VISUAL_BASE_URL, VISUAL_USER } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { authNavigationProject } from "./auth-navigation/project";

const LOCALE = "en";
const LOCAL_OAUTH_STATE = "auth-navigation-local-callback-state";
// 与认证客户端使用的本机 OAuth 回调标记字段保持一致。
const OAUTH_SUCCESS_QUERY_PARAM = "oauthSuccess";
const OAUTH_SUCCESS_STORAGE_KEY = "nextdevtpl:oauth-success-state";
const BASE_ORIGIN = new URL(VISUAL_BASE_URL).origin;
const AUTH_SIGN_IN_EMAIL_PATH = "/api/auth/sign-in/email";
const TEST_IP_NETWORKS: Readonly<Record<string, string>> = {
  desktop: "192.0.2",
  mobile: "198.51.100",
};
const testIpCounts = new Map<string, number>();
const selected = authNavigationProject(REPO_ROOT);
const { authNavigation, modules } = selected;
const hasAuth = modules.includes("auth") && authNavigation !== null;

interface PageHealth {
  expectOneInvalidEmailSignIn: () => void;
  assertHealthy: (context: string) => void;
}

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/u, "") || "/";
}

function localizedPath(destination: string | null): string {
  return normalizePathname(`/${LOCALE}${destination ?? "/sign-in"}`);
}

function isEmailSignInResponse(response: {
  request: () => { method: () => string };
  url: () => string;
}): boolean {
  const url = new URL(response.url());
  return (
    url.origin === BASE_ORIGIN &&
    url.pathname === AUTH_SIGN_IN_EMAIL_PATH &&
    url.search === "" &&
    response.request().method() === "POST"
  );
}

test.beforeEach(async ({ page }, testInfo) => {
  const network = TEST_IP_NETWORKS[testInfo.project.name];
  if (!network) {
    throw new Error(
      "Auth navigation test project has no isolated test IP range"
    );
  }
  const count = (testIpCounts.get(testInfo.project.name) ?? 0) + 1;
  if (count > 254)
    throw new Error("Auth navigation test IP range was exhausted");
  testIpCounts.set(testInfo.project.name, count);
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `${network}.${count}`,
  });
});

async function signInWithEmail(page: Page): Promise<void> {
  await page.goto(`/${LOCALE}/sign-in`);
  const email = page.getByLabel(messages.Auth.signIn.emailLabel, {
    exact: true,
  });
  await expect(email).toBeVisible();
  await email.fill(VISUAL_USER.email);
  await page
    .getByLabel(messages.Auth.signIn.passwordLabel, { exact: true })
    .fill(VISUAL_USER.password);
  const responsePromise = page.waitForResponse((response) => {
    return isEmailSignInResponse(response);
  });
  await page
    .getByRole("button", { name: messages.Auth.signIn.submit, exact: true })
    .click();
  const response = await responsePromise;
  expect(response.ok(), "邮箱登录接口应返回成功").toBe(true);
}

async function signUpWithEmail(page: Page): Promise<string> {
  const email = `auth-navigation-${randomUUID()}@example.com`;
  await page.goto(`/${LOCALE}/sign-up`);
  const name = page.getByLabel(messages.Auth.signUp.nameLabel, {
    exact: true,
  });
  await expect(name).toBeVisible();
  await name.fill("Auth Navigation Acceptance");
  await page
    .getByLabel(messages.Auth.signUp.emailLabel, { exact: true })
    .fill(email);
  await page
    .getByLabel(messages.Auth.signUp.passwordLabel, { exact: true })
    .fill("Auth-Navigation-2026");
  await page
    .getByLabel(messages.Auth.signUp.confirmPasswordLabel, { exact: true })
    .fill("Auth-Navigation-2026");
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.origin === BASE_ORIGIN &&
      response.request().method() === "POST" &&
      url.pathname === "/api/auth/sign-up/email" &&
      url.search === ""
    );
  });
  await page
    .getByRole("button", { name: messages.Auth.signUp.submit, exact: true })
    .click();
  const response = await responsePromise;
  expect(response.ok(), "邮箱注册接口应返回成功").toBe(true);
  return email;
}

async function expectSignedIn(
  page: Page,
  expectedEmail: string = VISUAL_USER.email
): Promise<void> {
  const cookies = await page.context().cookies();
  expect(
    cookies.some((cookie) => cookie.name.endsWith("better-auth.session_token"))
  ).toBe(true);

  const response = await page.request.get(
    new URL("/api/auth/get-session", page.url()).toString()
  );
  expect(response.ok()).toBe(true);
  const session: unknown = await response.json();
  expect(sessionEmail(session)).toBe(expectedEmail);
}

async function expectSignedOut(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  expect(
    cookies.some((cookie) => cookie.name.endsWith("better-auth.session_token"))
  ).toBe(false);

  const response = await page.request.get(
    new URL("/api/auth/get-session", page.url()).toString()
  );
  expect(response.ok()).toBe(true);
  const session: unknown = await response.json();
  expect(sessionEmail(session)).toBeNull();
}

function sessionEmail(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const user = (value as Record<string, unknown>).user;
  if (typeof user !== "object" || user === null || Array.isArray(user)) {
    return null;
  }
  const email = (user as Record<string, unknown>).email;
  return typeof email === "string" ? email : null;
}

function watchPage(page: Page): PageHealth {
  const issues: string[] = [];
  const expectedUnauthorizedSignIn = {
    enabled: false,
    responseCount: 0,
    consoleCount: 0,
  };
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url;
    let url: URL | undefined;
    try {
      url = new URL(location);
    } catch {
      // Console messages without an absolute resource URL are not exempt.
    }
    const expectedUnauthorizedConsole =
      expectedUnauthorizedSignIn.enabled &&
      expectedUnauthorizedSignIn.consoleCount === 0 &&
      url?.origin === BASE_ORIGIN &&
      url.pathname === AUTH_SIGN_IN_EMAIL_PATH &&
      url.search === "" &&
      message.text() ===
        "Failed to load resource: the server responded with a status of 401 (UNAUTHORIZED)";
    if (expectedUnauthorizedConsole) {
      expectedUnauthorizedSignIn.consoleCount += 1;
    } else {
      issues.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "request failed";
    if (
      new URL(request.url()).origin === BASE_ORIGIN &&
      !failure.includes("ERR_ABORTED")
    ) {
      issues.push(`request: ${request.method()} ${request.url()} ${failure}`);
    }
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== BASE_ORIGIN) return;
    if (
      expectedUnauthorizedSignIn.enabled &&
      isEmailSignInResponse(response) &&
      response.status() === 401
    ) {
      expectedUnauthorizedSignIn.responseCount += 1;
      if (expectedUnauthorizedSignIn.responseCount > 1) {
        issues.push(`Repeated expected HTTP 401: ${response.url()}`);
      }
      return;
    }
    if (
      response.status() >= 500 ||
      response.status() === 401 ||
      response.status() === 429
    ) {
      issues.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  return {
    expectOneInvalidEmailSignIn() {
      if (expectedUnauthorizedSignIn.enabled) {
        throw new Error(
          "Expected unauthorized sign-in response was already registered"
        );
      }
      expectedUnauthorizedSignIn.enabled = true;
    },
    assertHealthy(context) {
      if (
        expectedUnauthorizedSignIn.enabled &&
        (expectedUnauthorizedSignIn.responseCount !== 1 ||
          expectedUnauthorizedSignIn.consoleCount !== 1)
      ) {
        issues.push(
          `Expected one matching HTTP 401 and console error; received ${expectedUnauthorizedSignIn.responseCount} response(s) and ${expectedUnauthorizedSignIn.consoleCount} console error(s)`
        );
      }
      expect(issues, `浏览器错误或本机异常请求：${context}`).toEqual([]);
    },
  };
}

async function attachPageState(name: string, page: Page): Promise<void> {
  await test.info().attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test("生产生成项目的邮箱登录遵循实际认证去向并建立真实会话", async ({
  page,
}) => {
  test.skip(!hasAuth, "该生成项目不包含认证模块");
  if (!authNavigation) return;
  const health = watchPage(page);

  await signInWithEmail(page);
  await expect
    .poll(() => normalizePathname(new URL(page.url()).pathname))
    .toBe(localizedPath(authNavigation.afterSignIn));
  await expectSignedIn(page);
  await attachPageState("邮箱登录后的实际去向", page);
  health.assertHealthy("邮箱登录与真实会话确认后");
});

test("没有登录后页面时注册留在注册页并建立真实会话", async ({ page }) => {
  test.skip(
    !hasAuth || authNavigation?.afterSignIn !== null,
    "该生成项目有注册成功后的导航目的地"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  expect(authNavigation.afterSignIn).toBeNull();
  const email = await signUpWithEmail(page);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-up"
  );
  await expect(
    page.getByText(messages.Auth.signUp.success, { exact: true })
  ).toBeVisible();
  await expectSignedIn(page, email);
  await attachPageState("无登录目的地时的注册成功状态", page);
  health.assertHealthy("注册留页与新建会话确认后");
});

test("有登录后页面时注册进入生成配置并建立真实会话", async ({ page }) => {
  test.skip(
    !hasAuth || authNavigation?.afterSignIn === null,
    "该生成项目没有注册成功后的导航目的地"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  const email = await signUpWithEmail(page);
  await expect
    .poll(() => normalizePathname(new URL(page.url()).pathname))
    .toBe(localizedPath(authNavigation.afterSignIn));
  await expect(
    page.getByText(messages.Auth.signUp.success, { exact: true })
  ).toBeVisible();
  await expectSignedIn(page, email);
  await attachPageState("注册后的实际认证去向", page);
  health.assertHealthy("注册落点与新建会话确认后");
});

test("没有控制台时，邮箱登录进入实际保留的设置页", async ({ page }) => {
  test.skip(
    !hasAuth || modules.includes("dashboard") || !modules.includes("settings"),
    "该生成项目没有无控制台的设置页组合"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  expect(authNavigation.afterSignIn).toBe("/dashboard/settings");
  await signInWithEmail(page);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/dashboard/settings"
  );
  await expect(page.locator("#settings-name")).toBeVisible();
  await expectSignedIn(page);
  await attachPageState("无控制台时的设置落点", page);
  health.assertHealthy("设置页落点与真实会话确认后");
});

test("没有营销首页时，登出返回登录页并清除真实会话", async ({ page }) => {
  test.skip(
    !hasAuth ||
      !modules.includes("dashboard") ||
      modules.includes("marketing") ||
      authNavigation?.afterSignIn === null,
    "该生成项目没有营销页缺失且保留登录后入口的组合"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  expect(authNavigation.afterSignOut).toBe("/sign-in");
  await signInWithEmail(page);
  await expect(page).toHaveURL(
    (url) =>
      normalizePathname(url.pathname) ===
      localizedPath(authNavigation.afterSignIn)
  );
  await expectSignedIn(page);

  await page.locator('header button[aria-haspopup="menu"]').click();
  await page
    .getByRole("menuitem", {
      name: messages.Dashboard.sidebar.logout,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-in"
  );
  await expect(
    page.getByLabel(messages.Auth.signIn.emailLabel, { exact: true })
  ).toBeVisible();
  await expectSignedOut(page);
  await attachPageState("无营销首页时的登出落点", page);
  health.assertHealthy("登出与会话清除后");
});

test("没有控制台时，设置页可真实删除账户并返回登录页", async ({ page }) => {
  test.skip(
    !hasAuth ||
      modules.includes("dashboard") ||
      !modules.includes("settings") ||
      authNavigation?.afterSignIn !== "/dashboard/settings" ||
      authNavigation.afterSignOut !== "/sign-in",
    "该生成项目没有无控制台设置页删号去向"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  const email = await signUpWithEmail(page);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/dashboard/settings"
  );
  await expectSignedIn(page, email);

  const deleteActionResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    const headers = response.request().headers();
    return (
      url.origin === BASE_ORIGIN &&
      response.request().method() === "POST" &&
      Boolean(headers["next-action"])
    );
  });
  const signOutResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.origin === BASE_ORIGIN &&
      url.pathname === "/api/auth/sign-out" &&
      response.request().method() === "POST"
    );
  });

  await page
    .getByRole("button", {
      name: messages.Settings.deleteAccount.button,
      exact: true,
    })
    .click();
  await expect(
    page.getByText(messages.Settings.deleteAccount.confirmTitle, {
      exact: true,
    })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: messages.Settings.deleteAccount.confirm,
      exact: true,
    })
    .click();

  expect((await deleteActionResponse).ok()).toBe(true);
  expect((await signOutResponse).ok()).toBe(true);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-in"
  );
  await expect(
    page.getByLabel(messages.Auth.signIn.emailLabel, { exact: true })
  ).toBeVisible();
  await expectSignedOut(page);
  await attachPageState("无控制台时删除账户后的登录状态", page);
  health.assertHealthy("删号、真实登出与会话清除后");
});

test("没有登录后页面时登录留在登录页且仍可操作", async ({ page }) => {
  test.skip(
    !hasAuth || authNavigation?.afterSignIn !== null,
    "该生成项目有登录成功后的导航目的地"
  );
  if (!authNavigation) return;
  const health = watchPage(page);

  expect(authNavigation.afterSignIn).toBeNull();
  await signInWithEmail(page);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-in"
  );
  const email = page.getByLabel(messages.Auth.signIn.emailLabel, {
    exact: true,
  });
  await expect(email).toBeEnabled();
  await expectSignedIn(page);
  await attachPageState("无登录目的地时的成功状态", page);

  await page
    .getByLabel(messages.Auth.signIn.passwordLabel, { exact: true })
    .fill("invalid-auth-navigation-password");
  const responsePromise = page.waitForResponse((response) => {
    return isEmailSignInResponse(response);
  });
  health.expectOneInvalidEmailSignIn();
  await page
    .getByRole("button", { name: messages.Auth.signIn.submit, exact: true })
    .click();
  const response = await responsePromise;
  expect(response.status(), "故意使用错误密码时邮箱登录接口应返回 401").toBe(
    401
  );
  await expect(
    page.getByText(messages.Auth.signIn.errors.invalidCredentials, {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: messages.Auth.signIn.submit,
      exact: true,
    })
  ).toBeEnabled();
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-in"
  );
  await expectSignedIn(page);
  health.assertHealthy("登录页保持可操作且原会话仍有效后");
});

test("本机 OAuth 回调标记模拟仅在真实会话后消费一次，不验证外部供应商", async ({
  page,
}) => {
  test.skip(
    !hasAuth || authNavigation?.afterSignIn !== null,
    "本机回调标记模拟只适用于无登录成功目的地的认证项目"
  );
  const health = watchPage(page);

  await signInWithEmail(page);
  await expect(page).toHaveURL(
    (url) => normalizePathname(url.pathname) === "/en/sign-in"
  );
  await expectSignedIn(page);

  await page.evaluate(
    ({ key, state }) => window.sessionStorage.setItem(key, state),
    { key: OAUTH_SUCCESS_STORAGE_KEY, state: LOCAL_OAUTH_STATE }
  );
  await page.goto(
    `/${LOCALE}/sign-in?${OAUTH_SUCCESS_QUERY_PARAM}=${LOCAL_OAUTH_STATE}`
  );
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/en/sign-in" &&
      !url.searchParams.has(OAUTH_SUCCESS_QUERY_PARAM)
  );
  await expect(
    page.getByText(messages.Auth.signIn.success, { exact: true })
  ).toBeVisible();
  await attachPageState("本机 OAuth 回调标记确认状态", page);
  await expect
    .poll(() =>
      page.evaluate(
        (key) => window.sessionStorage.getItem(key),
        OAUTH_SUCCESS_STORAGE_KEY
      )
    )
    .toBeNull();

  await page.reload();
  await expect(
    page.getByLabel(messages.Auth.signIn.emailLabel, { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(messages.Auth.signIn.success, { exact: true })
  ).toHaveCount(0);
  await expectSignedIn(page);
  health.assertHealthy("本机回调标记消费一次后");
});
