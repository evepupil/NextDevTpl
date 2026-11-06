#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { generateProject } from "./generate.js";
import type { SkinSourceSelection } from "./skins/source-types.js";
import type {
  DeploymentTarget,
  GeneratorOptions,
  PresetName,
  ServiceKind,
} from "./types.js";

const HELP = `create-nextdevtpl <directory> [options]

Options:
  --preset minimal|saas|ai-saas|custom
  --modules auth,dashboard,...
  --target server|docker|vercel|cloudflare
  --payment creem|stripe|none
  --storage s3-compatible|r2-binding|none
  --mail disabled|resend|smtp|cloudflare-email
  --ai openai-compatible|anthropic|workers-ai|none
  --alerts noop|email|webhook
  --analytics noop|logger|posthog|ga4|umami|none
  --jobs inngest|cloudflare-workflows|none
  --rate-limit noop|upstash|cloudflare-rate-limit
  --skin default|<directory>|https://.../skin.tgz
  --skin-sha256 <64-hex-digits>  Required for remote skins
  --skin-token-env <NAME>       Remote token environment variable
  --palette <slug>              StyleKit theme for the built-in skin
  --yes                 Accept defaults without prompts
  --no-install          Skip dependency installation
  --help                Show this help
`;

const SERVICE_FLAGS: Readonly<Record<string, ServiceKind>> = {
  "--payment": "payment",
  "--storage": "storage",
  "--mail": "mail",
  "--ai": "ai",
  "--alerts": "alerts",
  "--analytics": "analytics",
  "--jobs": "jobs",
  "--rate-limit": "rate-limit",
};

function readValue(
  args: readonly string[],
  index: number,
  flag: string
): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

export function parseCliArguments(
  args: readonly string[]
): GeneratorOptions | null {
  if (args.includes("--help") || args.includes("-h")) return null;

  let targetDirectory: string | undefined;
  let preset: PresetName | undefined;
  let target: DeploymentTarget | undefined;
  let modules: string[] | undefined;
  let install = true;
  let skinValue: string | undefined;
  let skinSha256: string | undefined;
  let skinTokenEnv: string | undefined;
  let palette: string | undefined;
  const adapterOverrides: Partial<Record<ServiceKind, string | null>> = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === "--yes") continue;
    if (argument === "--no-install") {
      install = false;
      continue;
    }
    if (argument === "--preset") {
      preset = readValue(args, index, argument) as PresetName;
      index += 1;
      continue;
    }
    if (argument === "--target") {
      target = readValue(args, index, argument) as DeploymentTarget;
      index += 1;
      continue;
    }
    if (argument === "--modules") {
      modules = readValue(args, index, argument)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (argument === "--skin") {
      if (skinValue !== undefined) throw new Error("Duplicate --skin option");
      skinValue = readValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--skin-sha256") {
      if (skinSha256 !== undefined)
        throw new Error("Duplicate --skin-sha256 option");
      skinSha256 = readValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--skin-token-env") {
      if (skinTokenEnv !== undefined)
        throw new Error("Duplicate --skin-token-env option");
      skinTokenEnv = readValue(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--palette") {
      if (palette !== undefined) {
        throw new Error("Duplicate --palette option");
      }
      palette = readValue(args, index, argument);
      index += 1;
      continue;
    }
    const service = SERVICE_FLAGS[argument];
    if (service) {
      const value = readValue(args, index, argument);
      adapterOverrides[service] =
        value === "none" ? null : `${service}:${value}`;
      index += 1;
      continue;
    }
    if (argument.startsWith("-")) throw new Error("Unknown option");
    if (targetDirectory)
      throw new Error("Only one target directory is allowed");
    targetDirectory = argument;
  }

  if (!targetDirectory) throw new Error("A target directory is required");
  let skin: SkinSourceSelection = { kind: "builtin", id: "default" };
  if (skinValue !== undefined && skinValue !== "default") {
    const isWindowsPath =
      /^[A-Za-z]:[\\/]/u.test(skinValue) ||
      skinValue.startsWith("\\\\") ||
      skinValue.startsWith("//");
    if (!isWindowsPath && /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(skinValue)) {
      let url: URL;
      try {
        url = new URL(skinValue);
      } catch {
        throw new Error("Remote skin URL is invalid");
      }
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      ) {
        throw new Error("Remote skin URL must be a plain HTTPS URL");
      }
      if (!skinSha256 || !/^[a-f0-9]{64}$/iu.test(skinSha256)) {
        throw new Error("Remote skins require a 64-digit SHA-256 digest");
      }
      if (
        skinTokenEnv !== undefined &&
        !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(skinTokenEnv)
      ) {
        throw new Error("Skin token environment variable name is invalid");
      }
      skin = {
        kind: "remote",
        url: url.href,
        sha256: skinSha256.toLowerCase(),
        ...(skinTokenEnv ? { tokenEnv: skinTokenEnv } : {}),
      };
    } else {
      if (skinSha256 !== undefined || skinTokenEnv !== undefined) {
        throw new Error("Remote skin options require an HTTPS skin source");
      }
      skin = { kind: "local", directory: skinValue };
    }
  } else if (skinSha256 !== undefined || skinTokenEnv !== undefined) {
    throw new Error("Remote skin options require an HTTPS skin source");
  }
  return {
    targetDirectory,
    install,
    ...(preset ? { preset } : {}),
    ...(target ? { target } : {}),
    skin,
    ...(palette !== undefined ? { palette } : {}),
    ...(modules ? { modules } : {}),
    ...(Object.keys(adapterOverrides).length > 0 ? { adapterOverrides } : {}),
  };
}

async function main(): Promise<void> {
  const options = parseCliArguments(process.argv.slice(2));
  if (!options) {
    process.stdout.write(HELP);
    return;
  }
  const result = await generateProject(options);
  process.stdout.write(
    `Created NextDevTpl project in ${result.targetDirectory}\n`
  );
  for (const warning of result.warnings) {
    process.stdout.write(`Warning: ${warning}\n`);
  }
  if (result.manifest.bindings.length > 0) {
    process.stdout.write(
      `Required Cloudflare bindings: ${result.manifest.bindings.join(", ")}\n`
    );
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`create-nextdevtpl: ${message}\n`);
    process.exitCode = 1;
  });
}
