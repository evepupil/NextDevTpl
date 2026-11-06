import path from "node:path";

import { request } from "@playwright/test";

import { VISUAL_BASE_URL, VISUAL_NOW } from "../visual/constants";
import { prepareDatabase } from "../visual/db/prepare";
import { AUTH_STATE_FILE, REPO_ROOT } from "../visual/paths";
import { rememberServer, takeServer } from "../visual/run-state";
import { fetchServerClock, startDevServer } from "../visual/server/dev-server";
import { buildServerEnv } from "../visual/server/env";
import { signInAndSaveState } from "../visual/server/sign-in";
import { skinAcceptanceProject } from "./project";
import { skinTargets } from "./targets";

async function warmUpRoutes(modules: readonly string[]): Promise<void> {
  const anonymous = await request.newContext({ baseURL: VISUAL_BASE_URL });
  const authenticated = await request.newContext({
    baseURL: VISUAL_BASE_URL,
    storageState: AUTH_STATE_FILE,
  });
  try {
    const visited = new Set<string>();
    for (const { target } of skinTargets(modules)) {
      if (visited.has(target.path)) continue;
      visited.add(target.path);
      const api = target.auth ? authenticated : anonymous;
      const response = await api.get(`/en${target.path}`, { timeout: 180_000 });
      if (!response.ok()) {
        throw new Error(
          `测试皮肤页面预热失败：${target.path} ${response.status()}`
        );
      }
    }
  } finally {
    await anonymous.dispose();
    await authenticated.dispose();
  }
}

export default async function globalSetup(): Promise<void> {
  const project = skinAcceptanceProject(REPO_ROOT);

  await prepareDatabase();
  const { env } = buildServerEnv(Date.parse(VISUAL_NOW) - Date.now());
  const server = await startDevServer(env, {
    projectRoot: project.directory,
    logFile: path.join(
      REPO_ROOT,
      "artifacts",
      "skins",
      "contrast",
      path.basename(project.directory),
      "server.log"
    ),
  });
  rememberServer(server);
  try {
    const serverNow = await fetchServerClock();
    const drift = serverNow - Date.parse(VISUAL_NOW);
    if (!Number.isFinite(drift) || drift < 0 || drift > 10 * 60_000) {
      throw new Error("测试皮肤服务器时间没有按验收约定平移。");
    }
    await signInAndSaveState();
    await warmUpRoutes(project.modules);
    console.log(`[skin] 隔离项目已就绪，进程号 ${server.pid}`);
  } catch (error) {
    takeServer();
    await server.stop();
    throw error;
  }
}
