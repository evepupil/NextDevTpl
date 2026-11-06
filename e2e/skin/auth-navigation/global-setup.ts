import path from "node:path";

import { prepareDatabase } from "../../visual/db/prepare";
import { REPO_ROOT } from "../../visual/paths";
import {
  assertAuthNavigationPortFree,
  assertVisualDatabaseTarget,
  startAuthNavigationServer,
} from "./production-server";
import { assertProductionBuild, authNavigationProject } from "./project";
import { rememberServer } from "./run-state";

export default async function globalSetup(): Promise<void> {
  const project = authNavigationProject(REPO_ROOT);
  if (!project.modules.includes("auth")) return;
  if (!project.authNavigation) {
    throw new Error("认证模块存在，但生成项目缺少认证去向配置。");
  }

  assertVisualDatabaseTarget();
  assertProductionBuild(project.directory);
  await assertAuthNavigationPortFree();
  await prepareDatabase();

  const server = await startAuthNavigationServer({
    logFile: path.join(
      REPO_ROOT,
      "artifacts",
      "skins",
      "auth-navigation",
      path.basename(project.directory),
      "server.log"
    ),
    projectRoot: project.directory,
  });
  rememberServer(server);
  console.log(
    `[auth-navigation] 隔离生成项目生产服务已就绪，进程号 ${server.pid}`
  );
}
