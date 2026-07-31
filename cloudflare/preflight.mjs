import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const mode = args.has("--deploy")
  ? "deploy"
  : args.has("--build")
    ? "build"
    : "check";

function parseEnvFile(source) {
  const values = {};
  for (const line of source.replace(/^\uFEFF/, "").split(/\r?\n/u)) {
    const match =
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u.exec(line);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/u, "$2");
    values[match[1]] = value;
  }
  return values;
}

async function readEnvFile(path) {
  try {
    return parseEnvFile(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return {};
    throw error;
  }
}

function hasValue(environment, name) {
  const value = environment[name];
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isPostgresUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

function printList(label, names) {
  if (names.length === 0) return;
  console.error(`${label}: ${names.join(", ")}`);
}

async function main() {
  if (
    process.platform === "win32" &&
    (mode === "build" || mode === "deploy") &&
    process.env.NEXTDEVTPL_ALLOW_WINDOWS_CF_BUILD !== "1"
  ) {
    console.error(
      "Cloudflare OpenNext build is disabled on Windows because dependency symlink creation can fail with EPERM. Run this command in WSL/Linux, or set NEXTDEVTPL_ALLOW_WINDOWS_CF_BUILD=1 after accepting the risk."
    );
    process.exitCode = 1;
    return;
  }

  const config = JSON.parse(
    await readFile(join(directory, "preflight-config.json"), "utf8")
  );
  const environment = {
    ...(await readEnvFile(join(directory, "..", ".env"))),
    ...(await readEnvFile(join(directory, "..", ".env.local"))),
    ...(await readEnvFile(join(directory, "..", ".dev.vars"))),
    ...process.env,
  };
  const missing = config.required.filter(
    (name) => !hasValue(environment, name)
  );
  const invalid = [];
  if (
    hasValue(environment, "DATABASE_URL") &&
    !isPostgresUrl(environment.DATABASE_URL)
  ) {
    invalid.push("DATABASE_URL");
  }
  for (const name of ["BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL"]) {
    if (hasValue(environment, name) && !isHttpUrl(environment[name]))
      invalid.push(name);
  }
  const missingGroups = config.groups
    .filter((group) => !group.names.some((name) => hasValue(environment, name)))
    .map((group) => group.label);
  const incompletePairs = config.optionalPairs
    .filter(
      ([left, right]) =>
        hasValue(environment, left) !== hasValue(environment, right)
    )
    .map(([left, right]) => `${left}/${right}`);

  console.log(`Cloudflare preflight (${mode})`);
  console.log(
    `Required configuration: ${config.required.length} names checked`
  );
  printList("Missing local values", missing);
  printList("Invalid local values", [...new Set(invalid)]);
  printList("Missing one-of groups", missingGroups);
  printList("Incomplete optional pairs", incompletePairs);
  if (config.oauthCallback) {
    const callbackBase =
      environment.NEXT_PUBLIC_APP_URL || "<NEXT_PUBLIC_APP_URL>";
    console.log(
      `OAuth callback URLs: ${callbackBase}/api/auth/callback/google and ${callbackBase}/api/auth/callback/github`
    );
  }

  if (mode === "build") {
    if (missing.length || missingGroups.length) {
      console.warn(
        "Build continued with missing deployment values. Run pnpm cf:check after configuring local values before deployment."
      );
    }
    if (invalid.length || incompletePairs.length) process.exitCode = 1;
    return;
  }

  if (mode === "deploy") {
    const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const result = spawnSync(
      command,
      ["exec", "wrangler", "secret", "list", "--format", "json"],
      { cwd: join(directory, ".."), encoding: "utf8" }
    );
    if (result.status !== 0) {
      console.error(
        "Unable to list Wrangler secrets. Authenticate Wrangler and retry; secret values are never printed."
      );
      process.exitCode = 1;
      return;
    }
    let remoteNames;
    try {
      remoteNames = new Set(
        JSON.parse(result.stdout)
          .map((entry) => entry.name)
          .filter(Boolean)
      );
    } catch {
      console.error("Wrangler returned an unreadable secret list.");
      process.exitCode = 1;
      return;
    }
    const missingRemote = config.required.filter(
      (name) => !remoteNames.has(name)
    );
    const missingRemoteGroups = config.groups
      .filter((group) => !group.names.some((name) => remoteNames.has(name)))
      .map((group) => group.label);
    printList("Missing remote secrets", missingRemote);
    printList("Missing remote one-of secret groups", missingRemoteGroups);
    if (
      missing.length ||
      missingGroups.length ||
      missingRemote.length ||
      missingRemoteGroups.length ||
      invalid.length ||
      incompletePairs.length
    ) {
      process.exitCode = 1;
    }
    return;
  }

  if (
    missing.length ||
    missingGroups.length ||
    invalid.length ||
    incompletePairs.length
  ) {
    console.error(
      "Cloudflare preflight failed. Configure the listed names without printing their values."
    );
    process.exitCode = 1;
  } else {
    console.log("Cloudflare preflight passed.");
  }
}

await main();
