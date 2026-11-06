import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samePath(left: string, right: string): boolean {
  return process.platform === "win32"
    ? left.toLowerCase() === right.toLowerCase()
    : left === right;
}

export function resolveSkinAcceptanceProject(options: {
  directory: string;
  receipt: string;
  repositoryRoot: string;
}): { directory: string; modules: readonly string[] } {
  const receipt: unknown = JSON.parse(fs.readFileSync(options.receipt, "utf8"));
  if (
    !record(receipt) ||
    receipt.retained !== true ||
    receipt.removed !== false ||
    receipt.completed !== true ||
    typeof receipt.root !== "string" ||
    !record(receipt.projects)
  ) {
    throw new Error("请先完成生成验收，并用 --keep 保留本轮项目。");
  }
  const root = fs.realpathSync(receipt.root);
  const temporaryRoot = fs.realpathSync(tmpdir());
  const relativeRoot = path.relative(temporaryRoot, root);
  if (
    !relativeRoot ||
    relativeRoot === ".." ||
    relativeRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeRoot) ||
    !path.basename(root).startsWith("nextdevtpl-skins-")
  ) {
    throw new Error("验收回执不在本轮临时生成目录内。");
  }
  const directory = fs.realpathSync(options.directory);
  if (samePath(directory, fs.realpathSync(options.repositoryRoot))) {
    throw new Error("测试皮肤必须使用隔离生成项目。");
  }

  let matched = false;
  for (const [name, project] of Object.entries(receipt.projects)) {
    if (
      !/^[a-z][a-z0-9-]*$/u.test(name) ||
      !record(project) ||
      project.status !== "passed" ||
      typeof project.directory !== "string"
    ) {
      continue;
    }
    let projectDirectory: string;
    try {
      projectDirectory = fs.realpathSync(project.directory);
    } catch {
      continue;
    }
    if (
      samePath(directory, projectDirectory) &&
      samePath(path.relative(root, directory), name)
    ) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    throw new Error("验收目录不属于本轮已通过检查的生成项目。");
  }
  const generated: unknown = JSON.parse(
    fs.readFileSync(path.join(directory, "nextdevtpl.generated.json"), "utf8")
  );
  if (
    !record(generated) ||
    !Array.isArray(generated.modules) ||
    !generated.modules.every((module) => typeof module === "string")
  ) {
    throw new Error("测试目录缺少有效的生成记录。");
  }
  return { directory, modules: generated.modules };
}

export function skinAcceptanceProject(repositoryRoot: string) {
  const directory = process.env.NEXTDEVTPL_SKIN_PROJECT_DIR;
  const receipt = process.env.NEXTDEVTPL_SKIN_PROJECT_RECEIPT;
  if (!directory || !receipt) {
    throw new Error("请指定本轮保留的生成项目目录和验收回执。");
  }
  return resolveSkinAcceptanceProject({ directory, receipt, repositoryRoot });
}
