/**
 * 截图基线覆盖的页面清单
 *
 * 对应《视图契约》中 17 个面向用户的页面：15 个页面截图，2 个积分路由目前只会重定向，
 * 只校验重定向目标；设置页额外截取安全、账单、用量三个标签。
 */

import { VISUAL_TICKET_ID } from "./constants";

export type VisualPageGroup = "marketing" | "auth" | "dashboard";

interface VisualTargetBase {
  /** 页面编号，用于截图文件名，M1、M2 对比时按它对应 */
  id: string;
  group: VisualPageGroup;
  /** 不含语言前缀的路径，可带查询串 */
  path: string;
  /** 是否需要登录后访问 */
  auth: boolean;
}

export interface VisualScreenshotTarget extends VisualTargetBase {
  kind: "screenshot";
  /** 打开设置页后需要切换到的标签；不填表示停留在默认标签 */
  settingsTab?: "security" | "billing" | "usage";
}

export interface VisualRedirectTarget extends VisualTargetBase {
  kind: "redirect";
  /** 期望最终到达的路径（不含语言前缀，含查询串） */
  expectedPath: string;
}

export type VisualTarget = VisualScreenshotTarget | VisualRedirectTarget;

export const VISUAL_TARGETS: readonly VisualTarget[] = [
  // 营销组
  {
    auth: false,
    group: "marketing",
    id: "home",
    kind: "screenshot",
    path: "/",
  },
  {
    auth: false,
    group: "marketing",
    id: "legal-terms",
    kind: "screenshot",
    path: "/legal/terms",
  },
  {
    auth: false,
    group: "marketing",
    id: "blog-list",
    kind: "screenshot",
    path: "/blog",
  },
  {
    auth: false,
    group: "marketing",
    id: "blog-post",
    kind: "screenshot",
    path: "/blog/hello-world",
  },
  {
    auth: false,
    group: "marketing",
    id: "pseo-list",
    kind: "screenshot",
    path: "/pseo",
  },
  {
    auth: false,
    group: "marketing",
    id: "pseo-detail",
    kind: "screenshot",
    path: "/pseo/ai-meeting-notes",
  },
  // 登录组
  {
    auth: false,
    group: "auth",
    id: "sign-in",
    kind: "screenshot",
    path: "/sign-in",
  },
  {
    auth: false,
    group: "auth",
    id: "sign-up",
    kind: "screenshot",
    path: "/sign-up",
  },
  {
    auth: false,
    group: "auth",
    id: "forgot-password",
    kind: "screenshot",
    path: "/forgot-password",
  },
  {
    auth: false,
    group: "auth",
    id: "reset-password",
    kind: "screenshot",
    path: "/reset-password?token=visual-baseline-token",
  },
  // 控制台组
  {
    auth: true,
    group: "dashboard",
    id: "dashboard",
    kind: "screenshot",
    path: "/dashboard",
  },
  {
    auth: true,
    expectedPath: "/dashboard/settings?tab=usage",
    group: "dashboard",
    id: "credits",
    kind: "redirect",
    path: "/dashboard/credits",
  },
  {
    auth: true,
    expectedPath: "/dashboard/settings?tab=usage",
    group: "dashboard",
    id: "credits-buy",
    kind: "redirect",
    path: "/dashboard/credits/buy",
  },
  {
    auth: true,
    group: "dashboard",
    id: "settings",
    kind: "screenshot",
    path: "/dashboard/settings",
  },
  {
    auth: true,
    group: "dashboard",
    id: "settings-security",
    kind: "screenshot",
    path: "/dashboard/settings",
    settingsTab: "security",
  },
  {
    auth: true,
    group: "dashboard",
    id: "settings-billing",
    kind: "screenshot",
    path: "/dashboard/settings",
    settingsTab: "billing",
  },
  {
    auth: true,
    group: "dashboard",
    id: "settings-usage",
    kind: "screenshot",
    path: "/dashboard/settings",
    settingsTab: "usage",
  },
  {
    auth: true,
    group: "dashboard",
    id: "support-list",
    kind: "screenshot",
    path: "/dashboard/support",
  },
  {
    auth: true,
    group: "dashboard",
    id: "support-new",
    kind: "screenshot",
    path: "/dashboard/support/new",
  },
  {
    auth: true,
    group: "dashboard",
    id: "support-detail",
    kind: "screenshot",
    path: `/dashboard/support/${VISUAL_TICKET_ID}`,
  },
];
