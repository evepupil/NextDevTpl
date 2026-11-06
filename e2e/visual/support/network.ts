/**
 * 页面网络请求的“安静”判断
 *
 * Playwright 自带的 networkidle 只在页面加载阶段判断一次；而设置页切换标签后才会发出新的数据请求，
 * 所以这里自己记录进行中的请求，任何时候都能问一句“现在安静了吗”。
 * WebSocket（Next 热更新通道）不会触发 request 事件，不会干扰判断。
 *
 * 整页跳转（文档重新加载）时，旧页面发出的请求会被浏览器直接丢弃，Playwright 不一定为它们补发“结束”事件，
 * 所以新文档解析完成时，要把“导航提交之前发出的请求”从进行中名单里清掉，否则会永远等不到安静。
 */

import type { Page, Request } from "@playwright/test";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class NetworkTracker {
  /** 进行中的请求 -> 发出时间 */
  private readonly inFlight = new Map<Request, number>();
  private lastChange = Date.now();
  private lastNavigatedAt = 0;

  constructor(page: Page) {
    page.on("request", (request) => {
      this.inFlight.set(request, Date.now());
      this.lastChange = Date.now();
    });
    const settle = (request: Request) => {
      if (this.inFlight.delete(request)) this.lastChange = Date.now();
    };
    page.on("requestfinished", settle);
    page.on("requestfailed", settle);

    // 主框架提交了新的导航（可能是整页跳转，也可能是 pushState）
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) this.lastNavigatedAt = Date.now();
    });
    // domcontentloaded 只在整页跳转时触发：此时丢弃提交导航之前发出的请求，它们属于已销毁的旧文档
    page.on("domcontentloaded", () => {
      for (const [request, startedAt] of this.inFlight) {
        if (startedAt < this.lastNavigatedAt) this.inFlight.delete(request);
      }
      this.lastChange = Date.now();
    });
  }

  /** 进行中请求的网址，超时报错时用来定位是谁没结束 */
  pendingUrls(): string[] {
    return [...this.inFlight.keys()].map(
      (request) => `${request.method()} ${request.url()}`
    );
  }

  /** 连续 quietMs 毫秒没有进行中的请求，也没有新请求发出 */
  async waitForQuiet(quietMs: number, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.inFlight.size === 0 && Date.now() - this.lastChange >= quietMs) {
        return;
      }
      await sleep(50);
    }
    throw new Error(
      `网络请求 ${timeoutMs / 1000} 秒内没有结束：\n${this.pendingUrls().join("\n")}`
    );
  }
}
