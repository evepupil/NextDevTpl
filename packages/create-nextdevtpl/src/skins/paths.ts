import type { Stats } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { failSkin } from "./errors.js";

const WINDOWS_RESERVED_NAME =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu;
const WINDOWS_INVALID_CHAR = /[<>:"|?*]/u;

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 0 && code <= 31;
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isWithinPath(parent: string, candidate: string): boolean {
  const relativePath = relative(resolve(parent), resolve(candidate));
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${sep}`))
  );
}

export function resolvePackagePath(root: string, relativePath: string): string {
  const path = resolve(root, ...relativePath.split("/"));
  if (!isWithinPath(root, path)) {
    failSkin(["Package path escapes its root"]);
  }
  return path;
}

export function validatePosixRelativePath(
  value: string,
  label: string
): string {
  if (
    value.length === 0 ||
    value.length > 512 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.startsWith("//") ||
    /^[A-Za-z]:/u.test(value) ||
    value.normalize("NFC") !== value
  ) {
    failSkin([`${label} must be a canonical POSIX relative path`]);
  }

  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        WINDOWS_INVALID_CHAR.test(segment) ||
        hasControlCharacter(segment) ||
        WINDOWS_RESERVED_NAME.test(segment)
    )
  ) {
    failSkin([`${label} contains an invalid path segment`]);
  }
  return value;
}

export async function listPackageFiles(
  root: string
): Promise<readonly string[]> {
  const files: string[] = [];
  const folded = new Map<string, string>();

  let rootInfo: Stats;
  try {
    rootInfo = await lstat(resolve(root));
  } catch {
    failSkin(["Skin package directory is unavailable"]);
  }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    failSkin(["Skin package root must be a regular directory"]);
  }

  async function visit(directory: string, relativeDirectory: string) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      validatePosixRelativePath(relativePath, "Package file path");
      const fullPath = resolvePackagePath(root, relativePath);
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) {
        failSkin(["Symbolic links are not allowed in skin packages"]);
      }

      const foldedPath = relativePath.toLowerCase();
      const prior = folded.get(foldedPath);
      if (prior && prior !== relativePath) {
        failSkin(["Package contains paths that differ only by case"]);
      }
      folded.set(foldedPath, relativePath);

      if (stat.isDirectory()) {
        await visit(fullPath, relativePath);
      } else if (stat.isFile()) {
        files.push(relativePath);
      } else {
        failSkin([
          "Skin packages may contain only regular files and directories",
        ]);
      }
    }
  }

  await visit(resolve(root), "");
  return files.sort((left, right) =>
    Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
  );
}
