import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

import { config } from "dotenv";

const root = resolve(import.meta.dirname, "..");
const serverPath = resolve(root, ".next", "standalone", "server.js");
await access(serverPath);
config({ path: resolve(root, ".env.test"), quiet: true });

const port = await new Promise((resolvePort, reject) => {
  const socket = createServer();
  socket.once("error", reject);
  socket.listen(0, "127.0.0.1", () => {
    const address = socket.address();
    if (!address || typeof address === "string") {
      socket.close();
      reject(new Error("Cannot allocate a health-check port"));
      return;
    }
    socket.close((error) => {
      if (error) reject(error);
      else resolvePort(address.port);
    });
  });
});

const child = spawn(process.execPath, [serverPath], {
  cwd: resolve(root, ".next", "standalone"),
  env: {
    ...process.env,
    APP_VERSION: "m4-smoke",
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
const capture = (chunk) => {
  output = `${output}${chunk.toString()}`.slice(-8_000);
};
child.stdout.on("data", capture);
child.stderr.on("data", capture);

const deadline = Date.now() + 30_000;
let report;
try {
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited early\n${output}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(6_000),
      });
      const candidate = await response.json();
      if (response.ok && candidate?.status === "healthy") {
        report = candidate;
        break;
      }
    } catch {
      // The standalone server may still be starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  if (!report) {
    throw new Error(`Production health check timed out\n${output}`);
  }
  if (report.checks?.database?.status !== "pass") {
    throw new Error("Production database health check did not pass");
  }
  process.stdout.write(
    `${JSON.stringify({
      status: report.status,
      version: report.version,
      database: report.checks.database.status,
    })}\n`
  );
} finally {
  child.kill();
}
