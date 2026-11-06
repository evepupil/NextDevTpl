import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

describe("target transaction filesystem guards", () => {
  it("does not read through a leaf symlink while recording an optional file", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const tempRoot = await fs.mkdtemp(join(tmpdir(), "nextdevtpl-leaf-link-"));
    const target = join(tempRoot, "target");
    const linkedPath = join(target, "pnpm-lock.yaml");
    const externalFile = join(tempRoot, "outside-lockfile.yaml");
    await fs.mkdir(target);
    await fs.writeFile(externalFile, "external file content", "utf8");

    const targetStat = await fs.lstat(target);
    const identity = {
      dev: targetStat.dev,
      ino: targetStat.ino,
      realPath: await fs.realpath(target),
    };
    const leafLinkStat = {
      dev: targetStat.dev,
      ino: targetStat.ino + 1,
      isDirectory: () => false,
      isFile: () => false,
      isSymbolicLink: () => true,
    } as unknown as Awaited<ReturnType<typeof fs.lstat>>;
    const externalReads: string[] = [];
    const lstatMock = vi.fn(async (path: string | Buffer | URL) => {
      if (typeof path === "string" && resolve(path) === linkedPath) {
        return leafLinkStat;
      }
      return fs.lstat(path);
    });
    const readFileMock = vi.fn(async (path: string | Buffer | URL) => {
      if (typeof path === "string" && resolve(path) === linkedPath) {
        externalReads.push(path);
        return fs.readFile(externalFile);
      }
      return fs.readFile(path);
    });

    vi.resetModules();
    vi.doMock("node:fs/promises", () => ({
      ...fs,
      lstat: lstatMock,
      readFile: readFileMock,
    }));
    try {
      const { recordTargetFileIfExists, runInTargetTransaction } = await import(
        "../../../packages/create-nextdevtpl/src/target-transaction"
      );
      await runInTargetTransaction(target, false, identity, async () => {
        try {
          await recordTargetFileIfExists(linkedPath);
        } catch {
          // Rejecting the link is safe; following it is not.
        }
      });

      expect(externalReads).toEqual([]);
    } finally {
      vi.doUnmock("node:fs/promises");
      vi.resetModules();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("continues rollback when an external process removes a generated parent directory", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const tempRoot = await fs.mkdtemp(
      join(tmpdir(), "nextdevtpl-missing-parent-")
    );
    const target = join(tempRoot, "existing-target");
    const otherFile = join(target, "generated.txt");
    const nestedDirectory = join(target, "nested");
    const nestedFile = join(nestedDirectory, "generated.txt");
    await fs.mkdir(target);

    try {
      const {
        ensureTrackedDirectory,
        recordTargetFile,
        runInTargetTransaction,
      } = await import(
        "../../../packages/create-nextdevtpl/src/target-transaction"
      );
      const targetStat = await fs.lstat(target);
      const identity = {
        dev: targetStat.dev,
        ino: targetStat.ino,
        realPath: await fs.realpath(target),
      };

      await expect(
        runInTargetTransaction(target, false, identity, async () => {
          await fs.writeFile(otherFile, "first output", "utf8");
          await recordTargetFile(otherFile, "first output");
          await ensureTrackedDirectory(nestedDirectory);
          await fs.writeFile(nestedFile, "nested output", "utf8");
          await recordTargetFile(nestedFile, "nested output");
          await fs.rm(nestedDirectory, { recursive: true });
          throw new Error("injected failure after external deletion");
        })
      ).rejects.toThrow();

      const after = await fs.lstat(target);
      expect({ dev: after.dev, ino: after.ino }).toEqual({
        dev: identity.dev,
        ino: identity.ino,
      });
      await expect(fs.readdir(target)).resolves.toEqual([]);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});
