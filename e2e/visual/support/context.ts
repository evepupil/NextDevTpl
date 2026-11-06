/**
 * 浏览器上下文的公共固定条件
 *
 * Playwright 项目配置和预热用的是同一份，保证预热走过的页面状态和正式用例完全一致。
 */

import { VISUAL_TIMEZONE } from "../constants";

/**
 * 浏览器启动参数
 *
 * 工单详情和控制台的卡片圆角在严格截图中会出现 1 色阶差异。三个独立 Edge 进程使用这组参数后，
 * 两页在同页重复截图和跨进程截图都逐字节一致。
 */
export const BROWSER_LAUNCH_ARGS = [
  "--disable-gpu",
  "--disable-partial-raster",
  "--disable-gpu-compositing",
] as const;

export const BASE_CONTEXT_OPTIONS = {
  // 像素比固定为 1，截图尺寸和基线逐像素对应
  deviceScaleFactor: 1,
  // 不能用 "reduce"：营销页的入场动画组件（src/components/motion/reveal.tsx）在“减少动态效果”下
  // 客户端渲染静态 div，而服务端渲染的 HTML 里已经带了 opacity:0 的内联样式，
  // 水合时 React 不会修补属性差异，结果是 Next 弹出水合错误遮罩，一整屏区块永远透明。
  // 所以用默认偏好，截图前由 support/ready.ts 滚一遍页面触发入场动画，再靠
  // toHaveScreenshot 的 animations: "disabled" 冻结动画。
  reducedMotion: "no-preference",
  timezoneId: VISUAL_TIMEZONE,
} as const;
