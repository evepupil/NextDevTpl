/**
 * 截图服务器的环境变量
 *
 * 目标：不管开发者本机的 .env.local 里写了什么，截图服务器看到的配置都完全一样。
 *
 * 为什么要逐个覆盖：Next 加载 .env* 文件时，进程里已经存在的键不会被文件覆盖。
 * 所以把仓库里 .env* 文件出现过的每一个键都显式写进子进程环境（需要的给固定值，其余给空串），
 * 开发者的真实密钥、数据库地址、第三方服务配置就不可能混进截图。
 * 项目读取配置时空串等同于“未配置”（见 src/lib/runtime-config.ts），可选服务会自动降级。
 */

import fs from "node:fs";
import path from "node:path";

import {
  VISUAL_BASE_URL,
  VISUAL_DATABASE_URL,
  VISUAL_SERVER_PORT,
  VISUAL_TIMEZONE,
} from "../constants";
import { VISUAL_AUTH_SECRET, VISUAL_PRICE_ENV } from "../fixtures";
import { REPO_ROOT, SHIFT_TIME_SCRIPT } from "../paths";

/**
 * 会被 Next 加载、也可能出现在 .env* 里的文件
 * .env.example 不会被 Next 加载，但它列出了项目认识的全部键，用来补全覆盖范围。
 */
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.example",
] as const;

/** 这些键是进程运行所必需的，即使 .env 文件里写了同名键也不能置空 */
const PROTECTED_KEYS = new Set(
  [
    "APPDATA",
    "COMSPEC",
    "HOME",
    "HOMEDRIVE",
    "HOMEPATH",
    "LOCALAPPDATA",
    "NODE_OPTIONS",
    "PATH",
    "PATHEXT",
    "PROGRAMDATA",
    "PROGRAMFILES",
    "SYSTEMDRIVE",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "WINDIR",
  ].map((key) => key.toUpperCase())
);

/**
 * 截图需要的固定值
 * 凡是代码里用 `??` 取默认值的键（空串不会触发默认值），也必须在这里给固定值：
 * - EMAIL_FROM、NEXT_PUBLIC_AVATARS_BUCKET_NAME：默认值写在 `??` 后面
 *
 * __NEXT_TEST_MODE 是 Next 自己的端到端测试用开关：打开后页面水合完成时会设置
 * window.__NEXT_HYDRATED，截图用例靠它判断“客户端已经接管页面”（见 support/ready.ts）。
 * 它只影响这个标记和少量测试用请求头，不改变页面渲染结果。
 */
const FIXED_VALUES: Readonly<Record<string, string>> = {
  __NEXT_TEST_MODE: "1",
  BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
  BETTER_AUTH_URL: VISUAL_BASE_URL,
  DATABASE_URL: VISUAL_DATABASE_URL,
  EMAIL_FROM: "NextDevTpl <noreply@example.com>",
  NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
  NEXT_PUBLIC_AVATARS_BUCKET_NAME: "avatars",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_ENV: "development",
  PORT: String(VISUAL_SERVER_PORT),
  TZ: VISUAL_TIMEZONE,
  ...VISUAL_PRICE_ENV,
};

/** 解析 `KEY=value` 形式的行，返回键名；.env.example 里被注释掉的示例也算 */
function extractKeys(content: string, includeCommented: boolean): string[] {
  const keys: string[] = [];
  const assignment = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
  const commented = /^\s*#\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/;
  for (const line of content.split(/\r?\n/)) {
    const key =
      assignment.exec(line)?.[1] ??
      (includeCommented ? commented.exec(line)?.[1] : undefined);
    if (key) keys.push(key);
  }
  return keys;
}

/** 收集 .env* 文件里出现过的全部键（去重） */
export function collectEnvKeys(root: string = REPO_ROOT): string[] {
  const keys = new Set<string>();
  for (const file of ENV_FILES) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const key of extractKeys(content, file === ".env.example")) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/** 把预加载脚本追加到已有的 NODE_OPTIONS 后面，路径统一用正斜杠避免转义问题 */
function withPreload(existing: string | undefined, script: string): string {
  const preload = `--require "${script.replaceAll("\\", "/")}"`;
  return existing ? `${existing} ${preload}` : preload;
}

/** 读环境变量，键名不区分大小写（Windows 的环境变量本来就不区分） */
function getEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const key = Object.keys(env).find(
    (candidate) => candidate.toUpperCase() === name.toUpperCase()
  );
  return key === undefined ? undefined : env[key];
}

/**
 * 写环境变量，键名不区分大小写
 * 子进程环境块里同一个变量不能出现两个只差大小写的键，所以有同名键就直接覆盖它。
 */
function setEnv(env: NodeJS.ProcessEnv, name: string, value: string): void {
  const key = Object.keys(env).find(
    (candidate) => candidate.toUpperCase() === name.toUpperCase()
  );
  env[key ?? name] = value;
}

/** 让回环地址不走代理，避免本机请求被环境里的 HTTP_PROXY 转走 */
function withLoopbackBypass(existing: string | undefined): string {
  const loopback = ["localhost", "127.0.0.1", "::1"];
  const current = (existing ?? "").split(",").filter(Boolean);
  return [...new Set([...current, ...loopback])].join(",");
}

export interface ServerEnvResult {
  /** 被显式置空的键 */
  blankedKeys: string[];
  env: NodeJS.ProcessEnv;
  /** 最终给了固定值的键，写进回报用 */
  fixedKeys: string[];
}

/**
 * 生成截图服务器的完整环境变量
 * @param timeOffsetMs 服务端时间平移量：固定时刻减去真实当前时刻，由 global-setup 算一次
 */
export function buildServerEnv(timeOffsetMs: number): ServerEnvResult {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const blankedKeys: string[] = [];

  for (const key of collectEnvKeys()) {
    if (PROTECTED_KEYS.has(key.toUpperCase())) continue;
    if (key in FIXED_VALUES) continue;
    setEnv(env, key, "");
    blankedKeys.push(key);
  }

  for (const [key, value] of Object.entries(FIXED_VALUES)) {
    setEnv(env, key, value);
  }
  setEnv(
    env,
    "NODE_OPTIONS",
    withPreload(getEnv(env, "NODE_OPTIONS"), SHIFT_TIME_SCRIPT)
  );
  setEnv(env, "VISUAL_TIME_OFFSET_MS", String(timeOffsetMs));
  setEnv(env, "NO_PROXY", withLoopbackBypass(getEnv(env, "NO_PROXY")));

  return { blankedKeys, env, fixedKeys: Object.keys(FIXED_VALUES).sort() };
}
