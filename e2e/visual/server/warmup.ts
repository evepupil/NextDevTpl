/**
 * 预热：正式截图之前，用真实浏览器把每个页面按用例的同一套流程走一遍
 *
 * 为什么要预热：开发服务器按需编译，页面第一次被访问时才编译。如果让 144 个用例去触发编译，
 * 编译过程中的热更新刷新、首次渲染的耗时抖动都会混进截图。预热之后所有页面都已编译完成，
 * 用例看到的是稳定状态。顺便记录每个页面首次访问的耗时，用来评估冷启动成本。
 *
 * 每个页面单独开一个浏览器上下文：和正式用例一致，也避免固定时钟在同一上下文里累积偏差
 * （Playwright 的固定时钟会让 performance.now() 领先文档时间线，同一上下文里每多打开一个页面
 * 偏差就更大，入场动画的启动时间被推迟，会表现成“页面一直在变化”）。
 */

import { chromium } from "@playwright/test";

import {
  VISUAL_BASE_URL,
  VISUAL_LOCALES,
  VISUAL_VIEWPORTS,
} from "../constants";
import { VISUAL_TARGETS } from "../pages";
import { AUTH_STATE_FILE } from "../paths";
import { BASE_CONTEXT_OPTIONS, BROWSER_LAUNCH_ARGS } from "../support/context";
import {
  openRedirectTarget,
  openScreenshotTarget,
  preparePage,
} from "../support/visit";

export interface WarmupTiming {
  /** 页面编号 */
  id: string;
  locale: string;
  ms: number;
}

export interface WarmupResult {
  edgeVersion: string;
  timings: WarmupTiming[];
  /** 预热期间遇到的问题（未捕获错误、接口 5xx），只作提示，不让预热失败 */
  warnings: string[];
}

export async function warmUpPages(): Promise<WarmupResult> {
  const browser = await chromium.launch({
    args: [...BROWSER_LAUNCH_ARGS],
    channel: "msedge",
    headless: true,
  });
  const timings: WarmupTiming[] = [];
  const warnings: string[] = [];
  try {
    for (const locale of VISUAL_LOCALES) {
      for (const target of VISUAL_TARGETS) {
        const context = await browser.newContext({
          ...BASE_CONTEXT_OPTIONS,
          baseURL: VISUAL_BASE_URL,
          colorScheme: "light",
          viewport: VISUAL_VIEWPORTS.desktop,
          ...(target.auth ? { storageState: AUTH_STATE_FILE } : {}),
        });
        const page = await context.newPage();
        const prepared = await preparePage(page, "light");
        const started = Date.now();
        try {
          if (target.kind === "redirect") {
            await openRedirectTarget(prepared, target, locale);
          } else {
            await openScreenshotTarget(prepared, target, locale);
          }
          await prepared.guards.assertHealthy("预热");
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          warnings.push(`${locale}-${target.id}：${reason}`);
        }
        timings.push({ id: target.id, locale, ms: Date.now() - started });
        await context.close();
      }
    }
    return { edgeVersion: browser.version(), timings, warnings };
  } finally {
    await browser.close();
  }
}
