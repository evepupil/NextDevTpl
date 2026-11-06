/**
 * 判断页面“已经画完”
 *
 * 截图拍到一半的状态（骨架、“...”占位、没水合的初始值、还没滚进视口所以还是透明的区块）
 * 会让基线时好时坏，所以截图前要同时满足下面这些条件，缺一个都不拍：
 * 1. 页面已水合：Next 在测试模式下会在根组件挂载后设置 window.__NEXT_HYDRATED，
 *    客户端取数、主题图标这类“水合后才变”的内容都要等它；
 * 2. 字体加载完成；
 * 3. 没有可见的骨架屏（animate-pulse）和单独显示的“...”占位；
 * 4. 网络请求连续 500ms 没有动静（服务端动作、会话查询都已返回）；
 * 5. 从上到下滚一遍页面：营销页的区块用“滚进视口才淡入”的入场动画（只触发一次），
 *    整页截图不会滚动，不滚一遍的话视口以下的区块会一直是透明的；
 * 6. 页面 DOM 连续 400ms 没有变化，且没有正在播放的有限时长动画（框架的入场动画靠脚本驱动）。
 * 最后 toHaveScreenshot 还会连续截图直到两张完全一样，作为最后一道保险。
 */

import type { Page } from "@playwright/test";

import type { NetworkTracker } from "./network";

const NETWORK_QUIET_MS = 500;
const DOM_QUIET_MS = 400;
const READY_TIMEOUT_MS = Number(process.env.VISUAL_DEBUG_TIMEOUT ?? 30_000);

interface ReadinessProbe {
  ellipsis: number;
  fontsLoaded: boolean;
  hydrated: boolean;
  skeletons: number;
}

/** 在浏览器里探测当前页面是否还有未完成的部分 */
function probeReadiness(): ReadinessProbe {
  const isVisible = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };
  const skeletons = [...document.querySelectorAll(".animate-pulse")].filter(
    isVisible
  );
  const ellipsis = [...document.querySelectorAll("body *")].filter(
    (element) =>
      element.children.length === 0 &&
      (element.textContent ?? "").trim() === "..." &&
      isVisible(element)
  );
  return {
    ellipsis: ellipsis.length,
    fontsLoaded: document.fonts.status === "loaded",
    hydrated:
      (window as unknown as { __NEXT_HYDRATED?: boolean }).__NEXT_HYDRATED ===
      true,
    skeletons: skeletons.length,
  };
}

/** 等 DOM 连续一段时间没有变化，并且没有还会结束的动画在播放 */
async function waitForDomQuiet(page: Page): Promise<void> {
  await page.evaluate(
    ({ maxMs, quietMs }) =>
      new Promise<void>((resolve, reject) => {
        const start = performance.now();
        let lastChange = start;
        // 记录变化最频繁的节点，超时报错时用来定位是谁一直在变
        const changes = new Map<string, number>();
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            const node = record.target;
            const element = node instanceof Element ? node : node.parentElement;
            // Next 开发指示器在自己的影子 DOM 里，它的变化与页面无关
            if (element?.closest("nextjs-portal")) continue;
            lastChange = performance.now();
            const key = `${record.type} ${element?.tagName}.${String(element?.className ?? "").slice(0, 40)} ${record.attributeName ?? ""}`;
            changes.set(key, (changes.get(key) ?? 0) + 1);
          }
        });
        observer.observe(document, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });

        const runningFinite = () =>
          document.getAnimations().filter((animation) => {
            const timing = animation.effect?.getComputedTiming();
            return (
              animation.playState === "running" &&
              timing !== undefined &&
              Number.isFinite(timing.endTime)
            );
          });

        const check = () => {
          const now = performance.now();
          const animating = runningFinite();
          if (now - lastChange >= quietMs && animating.length === 0) {
            observer.disconnect();
            resolve();
            return;
          }
          if (now - start > maxMs) {
            observer.disconnect();
            const top = [...changes.entries()]
              .sort((left, right) => right[1] - left[1])
              .slice(0, 5)
              .map(([key, count]) => `${count}× ${key}`);
            const animations = animating.map(
              (animation) =>
                `${(animation as CSSAnimation).animationName ?? "WAAPI"} ${animation.effect?.getComputedTiming().endTime}`
            );
            reject(
              new Error(
                `页面内容一直在变化，无法稳定。变化最多的节点：${JSON.stringify(top)}；` +
                  `仍在播放的有限时长动画：${JSON.stringify(animations)}`
              )
            );
            return;
          }
          setTimeout(check, 50);
        };
        check();
      }),
    { maxMs: READY_TIMEOUT_MS, quietMs: DOM_QUIET_MS }
  );
}

/**
 * 从上到下滚一遍页面再回到顶部
 * 每次只滚半屏，保证每个区块都会和视口相交；用 instant 避免页面自带的平滑滚动让位置还没到就继续下一步。
 */
async function scrollThroughPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const pause = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const jumpTo = (top: number) =>
      window.scrollTo({ behavior: "instant", top });
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    // 页面高度可能在滚动过程中增加，所以每一轮都重新读取
    for (
      let top = 0;
      top <= document.documentElement.scrollHeight;
      top += step
    ) {
      jumpTo(top);
      await pause(120);
    }
    jumpTo(document.documentElement.scrollHeight);
    await pause(200);
    jumpTo(0);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

function isReady(
  probe: ReadinessProbe,
  requireHydrationMarker: boolean
): boolean {
  return (
    (!requireHydrationMarker || probe.hydrated) &&
    probe.fontsLoaded &&
    probe.skeletons === 0 &&
    probe.ellipsis === 0
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 等页面完全画完，超时则带上当前状态报错，而不是拍一张半成品 */
export async function waitForPageReady(
  page: Page,
  tracker: NetworkTracker,
  options: { requireHydrationMarker?: boolean } = {}
): Promise<void> {
  const t0 = Date.now();
  const lap = (name: string) => {
    if (process.env.VISUAL_DEBUG_READY) {
      console.log(`[ready] ${name} +${Date.now() - t0}ms`);
    }
  };
  const deadline = Date.now() + READY_TIMEOUT_MS;
  for (;;) {
    const probe = await page.evaluate(probeReadiness);
    if (isReady(probe, options.requireHydrationMarker ?? true)) break;
    if (Date.now() > deadline) {
      throw new Error(
        `页面没有在 ${READY_TIMEOUT_MS / 1000} 秒内画完：${JSON.stringify(probe)}`
      );
    }
    await sleep(100);
  }
  lap("hydrated");

  await tracker.waitForQuiet(NETWORK_QUIET_MS, READY_TIMEOUT_MS);
  lap("network-quiet-1");
  await waitForDomQuiet(page);
  lap("dom-quiet-1");

  // 触发“滚进视口才显示”的入场动画，等动画结束后回到顶部（吸顶导航的位置取决于滚动位置，必须固定）
  await scrollThroughPage(page);
  lap("scrolled");
  await waitForDomQuiet(page);
  lap("dom-quiet-2");
  // 水合后才发起的请求、滚动触发的请求可能刚好在上面几步之间结束，再确认一次网络仍然安静
  await tracker.waitForQuiet(NETWORK_QUIET_MS, READY_TIMEOUT_MS);
  lap("network-quiet-2");
  const extra = Number(process.env.VISUAL_EXTRA_SETTLE_MS ?? 0);
  if (extra > 0) await sleep(extra);
}
