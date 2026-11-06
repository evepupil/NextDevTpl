import { join, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

describe("generation target preparation", () => {
  it("keeps an externally created target after a mkdir race and rollback", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const tempRoot = await fs.mkdtemp(
      join((await import("node:os")).tmpdir(), "nextdevtpl-target-race-")
    );
    const target = join(tempRoot, "raced-target");
    let externalCreateWon = false;
    const mkdirMock = vi.fn(
      async (
        path: Parameters<typeof fs.mkdir>[0],
        options?: Parameters<typeof fs.mkdir>[1]
      ): ReturnType<typeof fs.mkdir> => {
        if (
          !externalCreateWon &&
          typeof path === "string" &&
          resolve(path) === target
        ) {
          externalCreateWon = true;
          await fs.mkdir(target);
        }
        return fs.mkdir(path, options);
      }
    );

    vi.resetModules();
    vi.doMock("node:fs/promises", () => ({ ...fs, mkdir: mkdirMock }));
    try {
      const [{ prepareTarget }, { runInTargetTransaction }] = await Promise.all(
        [
          import("../../../packages/create-nextdevtpl/src/filesystem"),
          import("../../../packages/create-nextdevtpl/src/target-transaction"),
        ]
      );

      const prepared = await prepareTarget(target);
      expect(externalCreateWon).toBe(true);
      expect(prepared.created).toBe(false);

      const before = await fs.lstat(target);
      await expect(
        runInTargetTransaction(
          prepared.path,
          prepared.created,
          prepared.identity,
          async () => {
            throw new Error("injected generation failure");
          }
        )
      ).rejects.toThrow();

      const after = await fs.lstat(target);
      expect(after.isDirectory()).toBe(true);
      expect({ dev: after.dev, ino: after.ino }).toEqual({
        dev: before.dev,
        ino: before.ino,
      });
      await expect(fs.readdir(target)).resolves.toEqual([]);
    } finally {
      vi.doUnmock("node:fs/promises");
      vi.resetModules();
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("rejects a target replaced after preparation without removing either directory", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const tempRoot = await fs.mkdtemp(
      join((await import("node:os")).tmpdir(), "nextdevtpl-target-replace-")
    );
    const target = join(tempRoot, "target");
    const renamedOriginal = join(tempRoot, "renamed-original");

    try {
      const [{ prepareTarget }, { runInTargetTransaction }] = await Promise.all(
        [
          import("../../../packages/create-nextdevtpl/src/filesystem"),
          import("../../../packages/create-nextdevtpl/src/target-transaction"),
        ]
      );
      const prepared = await prepareTarget(target);
      expect(prepared.created).toBe(true);

      await fs.rename(target, renamedOriginal);
      await fs.mkdir(target);
      const replacementBefore = await fs.lstat(target);
      let taskRan = false;

      await expect(
        runInTargetTransaction(
          prepared.path,
          prepared.created,
          prepared.identity,
          async () => {
            taskRan = true;
          }
        )
      ).rejects.toThrow();

      expect(taskRan).toBe(false);
      const originalAfter = await fs.lstat(renamedOriginal);
      const replacementAfter = await fs.lstat(target);
      expect({ dev: originalAfter.dev, ino: originalAfter.ino }).toEqual({
        dev: prepared.identity.dev,
        ino: prepared.identity.ino,
      });
      expect({ dev: replacementAfter.dev, ino: replacementAfter.ino }).toEqual({
        dev: replacementBefore.dev,
        ino: replacementBefore.ino,
      });
      await expect(fs.readdir(renamedOriginal)).resolves.toEqual([]);
      await expect(fs.readdir(target)).resolves.toEqual([]);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});
