/**
 * 截图工具用到的所有路径
 *
 * 统一在这里换算，避免各个文件各自拼路径、各自猜仓库根目录在哪。
 * 产物一律放进 artifacts/visual/ 下面：该目录已被 .gitignore 忽略，
 * 而 Playwright 默认的 test-results/、playwright-report/ 没有被忽略，所以不能用默认位置。
 */

import path from "node:path";

import { VISUAL_ARTIFACTS_DIR } from "./constants";

/** 截图工具自己的目录（e2e/visual） */
export const VISUAL_DIR = __dirname;

/** 仓库根目录 */
export const REPO_ROOT = path.resolve(VISUAL_DIR, "..", "..");

/** 产物根目录的绝对路径 */
export const ARTIFACTS_ROOT = path.resolve(REPO_ROOT, VISUAL_ARTIFACTS_DIR);

/** 基线图片：baseline/<项目名>/<语言>-<页面编号>.png */
export const BASELINE_DIR = path.join(ARTIFACTS_ROOT, "baseline");

/** 每次运行的失败截图、差异图 */
export const RESULTS_DIR = path.join(ARTIFACTS_ROOT, "results");

/** HTML 报告 */
export const REPORT_DIR = path.join(ARTIFACTS_ROOT, "report");

/** 登录后保存的会话（storageState） */
export const AUTH_STATE_FILE = path.join(ARTIFACTS_ROOT, ".auth", "user.json");

/** 截图服务器的日志，出问题时看这里 */
export const SERVER_LOG_FILE = path.join(ARTIFACTS_ROOT, "server.log");

/** 本次运行的环境信息（浏览器版本、服务器进程号），供生成清单和异常清理使用 */
export const RUN_INFO_FILE = path.join(ARTIFACTS_ROOT, ".state", "run.json");

/** 数据库容器的编排文件（相对仓库根目录，给 docker compose -f 用） */
export const COMPOSE_FILE_RELATIVE = "e2e/visual/compose.yaml";

/** 基线清单，随代码一起入库 */
export const MANIFEST_FILE = path.join(VISUAL_DIR, "baseline-manifest.json");

/** 注入的样式表：隐藏开发指示器和滚动条，只在截图瞬间生效 */
export const SCREENSHOT_STYLE_FILE = path.join(
  VISUAL_DIR,
  "support",
  "screenshot.css"
);

/** 平移服务端时间的预加载脚本 */
export const SHIFT_TIME_SCRIPT = path.join(
  VISUAL_DIR,
  "server",
  "shift-time.cjs"
);

/** Next 开发服务器的输出目录，每次启动前清空 */
export const NEXT_DEV_DIR = path.join(REPO_ROOT, ".next", "dev");
