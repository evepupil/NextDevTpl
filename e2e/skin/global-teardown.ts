import { VISUAL_SERVER_PORT } from "../visual/constants";
import { takeServer } from "../visual/run-state";
import { isPortInUse } from "../visual/server/dev-server";

export default async function globalTeardown(): Promise<void> {
  const server = takeServer();
  await server?.stop();
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!(await isPortInUse(VISUAL_SERVER_PORT))) {
      console.log(`[skin] 验收服务已停止，端口 ${VISUAL_SERVER_PORT} 已释放`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`皮肤验收服务退出后端口仍被占用，进程号 ${server?.pid}`);
}
