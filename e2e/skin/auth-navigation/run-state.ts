import type { RunningAuthNavigationServer } from "./production-server";

let currentServer: RunningAuthNavigationServer | undefined;

export function rememberServer(server: RunningAuthNavigationServer): void {
  currentServer = server;
}

export function takeServer(): RunningAuthNavigationServer | undefined {
  const server = currentServer;
  currentServer = undefined;
  return server;
}
