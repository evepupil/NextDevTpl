import { spawnSync } from "node:child_process";

const sensitiveName = /(secret|token|password|private|credential|api.?key|database_url)/i;

function sensitiveValues(environment) {
  return Object.entries(environment)
    .filter(([name, value]) => sensitiveName.test(name) && value?.length >= 4)
    .map(([, value]) => value)
    .sort((left, right) => right.length - left.length);
}

export function redact(output, environment = process.env) {
  let result = output;
  for (const value of sensitiveValues(environment)) {
    result = result.split(value).join("[REDACTED]");
  }
  return result;
}

export function runCommand({ command, args, cwd, retries = 0 }) {
  let attempt = 0;
  while (attempt <= retries) {
    attempt += 1;
    const executable =
      process.platform === "win32"
        ? process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe"
        : command;
    const commandArgs =
      process.platform === "win32"
        ? ["/d", "/s", "/c", command, ...args]
        : args;
    const result = spawnSync(executable, commandArgs, {
      cwd,
      env: process.env,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.status === 0) return;
    if (attempt <= retries) continue;

    const invocation = redact(`${command} ${args.join(" ")}`);
    const output = redact(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    const detail = result.error ? `: ${result.error.message}` : "";
    throw new Error(
      `${invocation} failed after ${attempt} attempt(s)${detail}\n${output.slice(-12_000)}`
    );
  }
}

export function toWslPath(path) {
  const match = /^([a-z]):[\\/](.*)$/i.exec(path);
  if (!match) throw new Error(`Cannot convert path to WSL: ${path}`);
  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll("\\", "/")}`;
}
