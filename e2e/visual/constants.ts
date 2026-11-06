/**
 * 截图基线的固定约定
 *
 * 数据库、种子数据、截图服务器和截图用例共用这里的值。
 * 改动任何一个值都会让已有基线失效，需要重新拍摄基线。
 */

/** 截图时浏览器和服务端看到的“现在”（UTC），种子数据的时间都以它为参照 */
export const VISUAL_NOW = "2026-10-15T08:00:00.000Z";

/** 截图服务器和浏览器统一使用的时区 */
export const VISUAL_TIMEZONE = "UTC";

/** 截图专用开发服务器端口，避开日常开发使用的 3000 */
export const VISUAL_SERVER_PORT = 3100;

export const VISUAL_BASE_URL = `http://localhost:${VISUAL_SERVER_PORT}`;

/** 截图专用数据库，运行在 WSL Docker 中，见 compose.yaml */
export const VISUAL_DB = {
  database: "nextdevtpl_visual",
  host: "127.0.0.1",
  password: "nextdevtpl-visual",
  port: 15470,
  user: "nextdevtpl",
} as const;

export const VISUAL_DATABASE_URL = `postgresql://${VISUAL_DB.user}:${VISUAL_DB.password}@${VISUAL_DB.host}:${VISUAL_DB.port}/${VISUAL_DB.database}`;

/** 运行 Docker 的 WSL 发行版 */
export const VISUAL_WSL_DISTRO = "Ubuntu-24.04";

/** 控制台截图使用的登录账号 */
export const VISUAL_USER = {
  email: "alex.morgan@example.com",
  id: "visual_user",
  name: "Alex Morgan",
  password: "Visual-Baseline-2026",
} as const;

/** 工单回复里出现的客服账号 */
export const VISUAL_SUPPORT_AGENT = {
  email: "jordan.lee@example.com",
  id: "visual_support_agent",
  name: "Jordan Lee",
} as const;

/** 工单详情页截图使用的工单（未关闭，带往来消息） */
export const VISUAL_TICKET_ID = "visual_ticket_open";

/** 截图覆盖的语言 */
export const VISUAL_LOCALES = ["en", "zh"] as const;

export type VisualLocale = (typeof VISUAL_LOCALES)[number];

/** 截图覆盖的主题 */
export const VISUAL_THEMES = ["light", "dark"] as const;

export type VisualTheme = (typeof VISUAL_THEMES)[number];

/** 截图覆盖的设备尺寸，像素比固定为 1 */
export const VISUAL_VIEWPORTS = {
  desktop: { height: 900, width: 1440 },
  mobile: { height: 844, width: 390 },
} as const;

export type VisualDevice = keyof typeof VISUAL_VIEWPORTS;

/** 基线图片、对比结果和报告的存放目录（已被 .gitignore 的 /artifacts 忽略） */
export const VISUAL_ARTIFACTS_DIR = "artifacts/visual";
