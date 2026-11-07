import { expect, type Page, type Request } from "@playwright/test";

import { COOKIE_CONSENT_KEY } from "../../src/lib/cookie-consent";
import { VISUAL_BASE_URL } from "../visual/constants";

const FAILED_RESOURCE_TYPES = new Set([
  "fetch",
  "font",
  "image",
  "script",
  "stylesheet",
  "xhr",
]);
const EXPECTED_NAVIGATION_ABORTS = new Set([
  "net::ERR_ABORTED",
  "NS_BINDING_ABORTED",
]);

function isExpectedNavigationAbort(request: Request, error: string) {
  if (!EXPECTED_NAVIGATION_ABORTS.has(error)) return false;
  if (request.isNavigationRequest() && request.resourceType() === "document") {
    return true;
  }

  const url = new URL(request.url());
  if (url.origin !== new URL(VISUAL_BASE_URL).origin) return false;

  const headers = request.headers();
  return (
    headers.rsc !== undefined ||
    headers["next-router-prefetch"] !== undefined ||
    headers["next-router-segment-prefetch"] !== undefined ||
    url.searchParams.has("_rsc")
  );
}

export async function guardDemoPage(page: Page, theme: "light" | "dark") {
  const problems: string[] = [];
  const blockedByGuard = new WeakSet<Request>();
  page.on("pageerror", (error) => problems.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    const status = response.status();
    const resourceType = response.request().resourceType();
    if (
      status >= 500 ||
      (status >= 400 && FAILED_RESOURCE_TYPES.has(resourceType))
    ) {
      problems.push(`response: ${status} ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (blockedByGuard.has(request)) return;
    const error = request.failure()?.errorText ?? "unknown failure";
    if (isExpectedNavigationAbort(request, error)) return;
    problems.push(
      `request failed: ${request.method()} ${request.url()} (${error})`
    );
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = url.origin === new URL(VISUAL_BASE_URL).origin;
    const forbidden =
      (local && /^\/api(?:\/|$)/u.test(url.pathname)) ||
      request.headers()["next-action"] !== undefined ||
      !["GET", "HEAD"].includes(request.method()) ||
      (!local &&
        !["image", "font", "stylesheet"].includes(request.resourceType()));
    if (forbidden) {
      problems.push(
        `business request: ${request.method()} ${url.origin}${url.pathname}`
      );
      blockedByGuard.add(request);
      await route.abort("blockedbyclient");
    } else {
      await route.continue();
    }
  });
  await page.addInitScript(
    ({ consentKey, theme }) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem(consentKey, "essential");
    },
    { consentKey: COOKIE_CONSENT_KEY, theme }
  );
  return async () => {
    await expect(page.locator("html")).toHaveClass(
      new RegExp(`\\b${theme}\\b`)
    );
    expect(problems).toEqual([]);
  };
}
