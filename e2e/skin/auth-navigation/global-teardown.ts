import { assertAuthNavigationPortReleased } from "./production-server";
import { takeServer } from "./run-state";

export default async function globalTeardown(): Promise<void> {
  const server = takeServer();
  if (!server) return;
  await server.stop();
  await assertAuthNavigationPortReleased();
  console.log("[auth-navigation] 生产服务已停止，端口 3100 已释放");
}
