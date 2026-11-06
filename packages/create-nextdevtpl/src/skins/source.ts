import type { Stats } from "node:fs";
import { lstat, mkdtemp, rm } from "node:fs/promises";
import type { RequestOptions } from "node:https";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { extractSkinArchive } from "./archive.js";
import { downloadRemoteSkinArchive } from "./download.js";
import { failSkin } from "./errors.js";
import { resolveSkinSourceLimits, type SkinSourceLimits } from "./limits.js";
import { SkinSourceError, sanitizeSkinError } from "./source-env.js";
import type {
  RemoteSkinSourceSelection,
  ResolvedSkinSource,
  SkinSourceSelection,
} from "./source-types.js";

export interface ResolveSkinSourceOptions {
  templateRoot: string;
  env?: NodeJS.ProcessEnv;
  ca?: RequestOptions["ca"];
  tempDirectory?: string;
  limits?: Partial<SkinSourceLimits>;
}

const DEFAULT_SELECTION: SkinSourceSelection = {
  kind: "builtin",
  id: "default",
};

async function requireSourceDirectory(
  directory: string,
  label: string
): Promise<string> {
  let info: Stats;
  try {
    info = await lstat(directory);
  } catch {
    failSkin([`${label} directory is unavailable`]);
  }
  if (!info.isDirectory() || info.isSymbolicLink()) {
    failSkin([`${label} root must be a regular directory`]);
  }
  return resolve(directory);
}

function validateRemoteSelection(selection: RemoteSkinSourceSelection): string {
  if (!/^[a-f0-9]{64}$/iu.test(selection.sha256)) {
    failSkin(["Remote skin SHA-256 must contain 64 hexadecimal characters"]);
  }
  return selection.sha256.toLowerCase();
}

export async function resolveSkinSource(
  selection: SkinSourceSelection | undefined,
  options: ResolveSkinSourceOptions
): Promise<ResolvedSkinSource> {
  const selected = selection ?? DEFAULT_SELECTION;

  if (selected.kind === "builtin") {
    if (selected.id !== "default") {
      failSkin(["Unknown built-in skin identifier"]);
    }
    const directory = await requireSourceDirectory(
      resolve(options.templateRoot, "src", "skin"),
      "Built-in skin"
    );
    return {
      directory,
      source: { kind: "builtin", id: "default" },
      dispose: async () => undefined,
    };
  }

  if (selected.kind === "local") {
    if (
      typeof selected.directory !== "string" ||
      selected.directory.length === 0
    ) {
      failSkin(["Local skin directory is required"]);
    }
    const directory = await requireSourceDirectory(
      resolve(selected.directory),
      "Local skin"
    );
    return {
      directory,
      source: { kind: "local" },
      dispose: async () => undefined,
    };
  }

  const archiveSha256 = validateRemoteSelection(selected);
  const env = options.env ?? process.env;
  const limits = resolveSkinSourceLimits(options.limits);
  const tempParent = resolve(options.tempDirectory ?? tmpdir());
  let workDirectory: string | undefined;

  try {
    const createdDirectory = await mkdtemp(
      join(tempParent, "nextdevtpl-skin-")
    );
    workDirectory = createdDirectory;
    const archivePath = join(createdDirectory, "skin.tgz");
    const packageDirectory = join(createdDirectory, "package");

    await downloadRemoteSkinArchive(selected, archivePath, {
      env,
      ...(options.ca === undefined ? {} : { ca: options.ca }),
      limits,
    });
    await extractSkinArchive(archivePath, packageDirectory, limits);

    let disposed = false;
    return {
      directory: packageDirectory,
      source: { kind: "remote", archiveSha256 },
      dispose: async () => {
        if (disposed) return;
        try {
          await rm(createdDirectory, { recursive: true, force: true });
          disposed = true;
        } catch {
          throw sanitizeSkinError(
            new SkinSourceError("Temporary skin source could not be removed"),
            selected,
            env
          );
        }
      },
    };
  } catch (error) {
    if (workDirectory) {
      try {
        await rm(workDirectory, { recursive: true, force: true });
      } catch {
        throw sanitizeSkinError(
          new SkinSourceError("Temporary skin source could not be removed"),
          selected,
          env
        );
      }
    }
    throw sanitizeSkinError(error, selected, env);
  }
}
