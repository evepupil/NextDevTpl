import {
  access,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

interface TemplateManifest {
  entries: readonly string[];
  version: number;
}

export async function prepareTarget(path: string): Promise<{
  created: boolean;
  path: string;
}> {
  const target = resolve(path);
  let entries: string[];
  try {
    entries = await readdir(target);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    await mkdir(target, { recursive: true });
    return { created: true, path: target };
  }
  if (entries.length > 0) {
    throw new Error(`Target directory must be empty: ${target}`);
  }
  return { created: false, path: target };
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
    throw new Error("Invalid template manifest");
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
    await cp(source, resolve(target, entry), {
      recursive: true,
      errorOnExist: false,
      force: true,
    });
  }
}

export async function removePath(path: string): Promise<void> {
  await rm(path, { force: true, recursive: true });
}

export async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function installDependencies(
  target: string,
  packageManager: string
): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(packageManager, ["install"], {
      cwd: target,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${packageManager} install exited with ${code}`));
    });
  });
}
