/**
 * 打开一个截图目标页面，并等到它画完
 *
 * 全局预热和正式用例共用这一套流程，保证预热时走过的编译路径和用例完全一致。
 */

import type { Page } from "@playwright/test";

import {
  VISUAL_BASE_URL,
  VISUAL_NOW,
  type VisualLocale,
  type VisualTheme,
} from "../constants";
import type { VisualRedirectTarget, VisualScreenshotTarget } from "../pages";
import { PageGuards } from "./guards";
import { NetworkTracker } from "./network";
import { waitForPageReady } from "./ready";

export interface PreparedPage {
  guards: PageGuards;
  page: Page;
  tracker: NetworkTracker;
}

/**
 * 给新页面装好固定条件，必须在第一次导航之前调用
 * - 浏览器里的“现在”固定为 VISUAL_NOW（只固定 Date，定时器照常走）
 * - 预写主题和 Cookie 同意，页面一打开就是目标主题，也不会弹出 Cookie 横幅或加载统计脚本
 */
export async function preparePage(
  page: Page,
  theme: VisualTheme
): Promise<PreparedPage> {
  const tracker = new NetworkTracker(page);
  const guards = new PageGuards(page);
  await page.clock.setFixedTime(VISUAL_NOW);
  await page.addInitScript((themeName) => {
    try {
      window.localStorage.setItem("theme", themeName);
      window.localStorage.setItem("cookie-consent", "essential");
    } catch {
      // about:blank 等页面没有 localStorage，忽略
    }
  }, theme);
  return { guards, page, tracker };
}

/**
 * 把含查询串的路径拆成 pathname 和 search，方便和最终网址比较
 * 末尾斜杠不算差异：Next 会把 /en/ 规范成 /en。
 */
function splitPath(pathWithQuery: string): {
  pathname: string;
  search: string;
} {
  const url = new URL(pathWithQuery, VISUAL_BASE_URL);
  const pathname =
    url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  return { pathname, search: url.search };
}

function assertFinalUrl(page: Page, expectedPath: string): void {
  const actual = splitPath(page.url());
  const expected = splitPath(expectedPath);
  if (
    actual.pathname !== expected.pathname ||
    actual.search !== expected.search
  ) {
    throw new Error(
      `最终网址不对：期望 ${expected.pathname}${expected.search}，实际 ${actual.pathname}${actual.search}`
    );
  }
}

/** 点开设置页的某个标签；标签的 id 后缀是固定的 value，不随语言变化 */
async function openSettingsTab(
  prepared: PreparedPage,
  tab: NonNullable<VisualScreenshotTarget["settingsTab"]>
): Promise<void> {
  const trigger = prepared.page.locator(`[role="tab"][id$="-trigger-${tab}"]`);
  await trigger.click();
  await prepared.page
    .locator(`[role="tab"][id$="-trigger-${tab}"][data-state="active"]`)
    .waitFor();
  // 把鼠标移回角落并取消焦点，避免截图里带上悬停和聚焦样式
  await prepared.page.mouse.move(0, 0);
  await prepared.page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await waitForPageReady(prepared.page, prepared.tracker);
}

/** 打开截图页面：导航、校验最终网址、等画完，设置页再切到目标标签 */
export async function openScreenshotTarget(
  prepared: PreparedPage,
  target: VisualScreenshotTarget,
  locale: VisualLocale
): Promise<void> {
  const url = `/${locale}${target.path}`;
  const response = await prepared.page.goto(url, { waitUntil: "load" });
  if (!response || response.status() >= 400) {
    throw new Error(
      `${url} 返回了 HTTP ${response?.status() ?? "无响应"}，不能作为基线`
    );
  }
  assertFinalUrl(prepared.page, url);
  await waitForPageReady(prepared.page, prepared.tracker);
  if (target.settingsTab) {
    await openSettingsTab(prepared, target.settingsTab);
  }
}

/** 打开只校验重定向的页面：最终网址必须等于期望值 */
export async function openRedirectTarget(
  prepared: PreparedPage,
  target: VisualRedirectTarget,
  locale: VisualLocale
): Promise<void> {
  const response = await prepared.page.goto(`/${locale}${target.path}`, {
    waitUntil: "load",
  });
  if (!response || response.status() >= 400) {
    throw new Error(
      `${target.path} 返回了 HTTP ${response?.status() ?? "无响应"}`
    );
  }
  const expectedPath = `/${locale}${target.expectedPath}`;
  const expected = splitPath(expectedPath);
  await prepared.page.waitForURL(
    (url) =>
      url.pathname === expected.pathname && url.search === expected.search,
    { timeout: 30_000 }
  );
  assertFinalUrl(prepared.page, expectedPath);
  // 目标页面也会发起请求，等它们结束再收尾，避免用例结束时中断进行中的请求
  await waitForPageReady(prepared.page, prepared.tracker);
}
