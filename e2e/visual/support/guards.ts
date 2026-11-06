/**
 * 页面健康检查：出错的页面不能被拍成基线
 *
 * 以下情况都判定为失败：
 * - 页面抛出未捕获的 JS 错误
 * - 同源接口返回 5xx
 * - Next 开发模式弹出了错误遮罩（编译错误、渲染错误）
 *
 * 在截图之前、截图之后各检查一次：基线更新模式下 toHaveScreenshot 会直接写入图片，
 * 所以必须先确认页面是好的，再让它拍。
 */

import type { Page } from "@playwright/test";

import { VISUAL_BASE_URL } from "../constants";

export class PageGuards {
  private readonly consoleErrors: string[] = [];
  private readonly failedResponses: string[] = [];
  private readonly pageErrors: string[] = [];

  constructor(private readonly page: Page) {
    page.on("pageerror", (error) => {
      this.pageErrors.push(error.stack ?? error.message);
    });
    page.on("response", (response) => {
      if (
        response.status() >= 500 &&
        response.url().startsWith(VISUAL_BASE_URL)
      ) {
        this.failedResponses.push(
          `${response.status()} ${response.request().method()} ${response.url()}`
        );
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") this.consoleErrors.push(message.text());
    });
  }

  /** 控制台 error 级别的输出，不算失败，供人工排查时查看 */
  getConsoleErrors(): readonly string[] {
    return this.consoleErrors;
  }

  /** Next 错误遮罩的文字内容；没有遮罩返回 undefined */
  private async readErrorOverlay(): Promise<string | undefined> {
    return this.page.evaluate(() => {
      for (const portal of document.querySelectorAll("nextjs-portal")) {
        const dialog = portal.shadowRoot?.querySelector(
          "[data-nextjs-dialog-overlay], [data-nextjs-dialog], [role='dialog']"
        );
        if (dialog) return (dialog.textContent ?? "").trim().slice(0, 600);
      }
      return undefined;
    });
  }

  async assertHealthy(step: string): Promise<void> {
    const problems: string[] = [];
    if (this.pageErrors.length > 0) {
      problems.push(`页面未捕获错误：\n${this.pageErrors.join("\n")}`);
    }
    if (this.failedResponses.length > 0) {
      problems.push(`接口 5xx：\n${this.failedResponses.join("\n")}`);
    }
    const overlay = await this.readErrorOverlay();
    if (overlay !== undefined) {
      problems.push(`Next 错误遮罩：${overlay}`);
    }
    if (problems.length > 0) {
      throw new Error(`页面不健康（${step}）\n${problems.join("\n\n")}`);
    }
  }
}
