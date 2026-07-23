#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { generateProject } from "./generate.js";
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
  --jobs inngest|cloudflare-workflows|none
  --rate-limit noop|upstash|cloudflare-rate-limit
  --yes                 Accept defaults without prompts
  --no-install          Skip dependency installation
  --help                Show this help
`;

const SERVICE_FLAGS: Readonly<Record<string, ServiceKind>> = {
  "--payment": "payment",
  "--storage": "storage",
  "--mail": "mail",
  "--ai": "ai",
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
    const service = SERVICE_FLAGS[argument];
    if (service) {
      const value = readValue(args, index, argument);
      adapterOverrides[service] =
        value === "none" ? null : `${service}:${value}`;
      index += 1;
      continue;
    }
    if (argument.startsWith("-"))
      throw new Error(`Unknown option: ${argument}`);
    if (targetDirectory)
      throw new Error("Only one target directory is allowed");
    targetDirectory = argument;
  }

  if (!targetDirectory) throw new Error("A target directory is required");
  return {
    targetDirectory,
    install,
    ...(preset ? { preset } : {}),
    ...(target ? { target } : {}),
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
