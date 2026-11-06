import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { GeneratorError } from "./generator-error.js";
import {
  assertTargetPath,
  ensureTrackedDirectory,
  forgetTargetPath,
  isPathInActiveTarget,
  recordTargetFile,
  recordTargetFileIfExists,
  recordTargetTree,
  recordTargetTreeIfExists,
  type TargetIdentity,
} from "./target-transaction.js";

interface TemplateManifest {
  entries: readonly string[];
  version: number;
}

export type PackageManagerRunner = NonNullable<
  import("./generator-internals.js").GeneratorTestHooks["runProcess"]
>;

function packageManagerArgs(
  packageManager: string,
  args: readonly string[]
): string[] {
  const commandName = basename(packageManager).toLowerCase();
  if (commandName === "pnpm" || commandName === "pnpm.cmd") {
    return [...args, "--ignore-workspace"];
  }
  return [...args];
}

async function runProcess(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  runner?: PackageManagerRunner
): Promise<void> {
  if (runner) return runner(command, args, { cwd, env });
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", () =>
      reject(new GeneratorError("Package manager could not be started"))
    );
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new GeneratorError("Package manager process failed"));
    });
  });
}

export async function prepareTarget(path: string): Promise<{
  created: boolean;
  identity: TargetIdentity;
  path: string;
}> {
  const target = resolve(path);
  const prepared = async (created: boolean) => {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new GeneratorError("Target must be a real directory");
    }
    if ((await readdir(target)).length > 0) {
      throw new GeneratorError("Target directory must be empty");
    }
    return {
      created,
      identity: {
        dev: stat.dev,
        ino: stat.ino,
        realPath: await realpath(target),
      },
      path: target,
    };
  };
  let entries: string[];
  try {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new GeneratorError("Target must be a real directory");
    }
    entries = await readdir(target);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    await mkdir(dirname(target), { recursive: true });
    try {
      await mkdir(target);
      return await prepared(true);
    } catch (createError) {
      if ((createError as NodeJS.ErrnoException).code !== "EEXIST") {
        throw createError;
      }
      return await prepared(false);
    }
  }
  if (entries.length > 0) {
    throw new GeneratorError("Target directory must be empty");
  }
  return prepared(false);
}

export async function copyTemplate(
  templateRoot: string,
  manifestPath: string,
  target: string
): Promise<void> {
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8")
  ) as TemplateManifest;
  if (!Array.isArray(manifest.entries)) {
    throw new GeneratorError("Invalid template manifest");
  }
  for (const entry of manifest.entries) {
    let source = resolve(templateRoot, entry);
    if (entry === ".gitignore") {
      try {
        await access(source);
      } catch {
        source = resolve(templateRoot, "gitignore");
      }
    }
    const destination = resolve(target, entry);
    try {
      await cp(source, destination, {
        recursive: true,
        errorOnExist: false,
        force: true,
      });
    } finally {
      await recordTargetTree(destination).catch(() => undefined);
    }
  }
}

export async function createGenerationStage(target: string): Promise<{
  directory: string;
  project: string;
  dispose(): Promise<void>;
}> {
  const absoluteTarget = resolve(target);
  const parent = dirname(absoluteTarget);
  const directory = await mkdtemp(join(parent, ".nextdevtpl-stage-"));
  const project = join(directory, basename(absoluteTarget));
  try {
    await mkdir(project);
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  return {
    directory,
    project,
    dispose: async () => {
      await rm(directory, { recursive: true, force: true });
    },
  };
}

export async function deliverStage(
  stageProject: string,
  target: string,
  afterFileDelivered?: (relativePath: string) => Promise<void>
): Promise<void> {
  const sourceRoot = resolve(stageProject);
  const copyDirectory = async (source: string, destination: string) => {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      const sourcePath = join(source, entry.name);
      const destinationPath = join(destination, entry.name);
      if (entry.isDirectory()) {
        await ensureTrackedDirectory(destinationPath);
        await copyDirectory(sourcePath, destinationPath);
        continue;
      }
      if (!entry.isFile()) {
        throw new GeneratorError(
          "Generated stage contains an unsupported file type"
        );
      }
      try {
        await assertTargetPath(destinationPath);
        await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
          throw new GeneratorError("Generation target changed during delivery");
        }
        throw error;
      }
      await recordTargetFile(destinationPath, await readFile(sourcePath));
      await afterFileDelivered?.(relative(sourceRoot, sourcePath));
    }
  };
  await copyDirectory(stageProject, resolve(target));
}

export async function removePath(path: string): Promise<void> {
  if (await isPathInActiveTarget(path)) {
    throw new GeneratorError(
      "Recursive removal from the public target is not allowed"
    );
  }
  forgetTargetPath(path);
  await rm(path, { force: true, recursive: true });
}

export async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, content, "utf8");
  } catch (error) {
    await recordTargetFileIfExists(path);
    throw error;
  }
  await recordTargetFileIfExists(path);
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function installDependencies(
  target: string,
  packageManager: string,
  env: NodeJS.ProcessEnv = process.env,
  runner?: PackageManagerRunner
): Promise<void> {
  try {
    await runProcess(
      packageManager,
      packageManagerArgs(packageManager, ["install"]),
      target,
      env,
      runner
    );
  } finally {
    await recordTargetTreeIfExists(join(target, "node_modules"));
    await recordTargetFileIfExists(join(target, "pnpm-lock.yaml"));
    await recordTargetTreeIfExists(join(target, ".source"));
  }
}

export async function runPackageScript(
  target: string,
  packageManager: string,
  script: string,
  env: NodeJS.ProcessEnv = process.env,
  runner?: PackageManagerRunner
): Promise<void> {
  try {
    await runProcess(packageManager, ["run", script], target, env, runner);
  } finally {
    if (script === "db:generate:init") {
      await recordTargetTreeIfExists(join(target, "drizzle"));
    } else if (script === "cf:types") {
      await recordTargetFileIfExists(join(target, "worker-configuration.d.ts"));
    }
  }
}

export async function updateLockfileOnly(
  target: string,
  packageManager: string,
  env: NodeJS.ProcessEnv,
  runner?: PackageManagerRunner
): Promise<void> {
  await runProcess(
    packageManager,
    packageManagerArgs(packageManager, [
      "install",
      "--lockfile-only",
      "--ignore-scripts",
      "--prefer-offline",
    ]),
    target,
    env,
    runner
  );
}
