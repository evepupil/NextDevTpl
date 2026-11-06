import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

const delay = (milliseconds: number) =>
  new Promise<void>((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds)
  );

async function createTarget(fs: typeof import("node:fs/promises")) {
  const root = await fs.mkdtemp(join(tmpdir(), "nextdevtpl-tree-scan-"));
  const target = join(root, "target");
  await fs.mkdir(target);
  const stat = await fs.lstat(target);
  return {
    identity: {
      dev: stat.dev,
      ino: stat.ino,
      realPath: await fs.realpath(target),
    },
    root,
    target,
  };
}

describe("target tree scan concurrency", () => {
  it("waits for an in-flight file read before rollback starts", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const { identity, root, target } = await createTarget(fs);
    const treeRoot = join(target, "tree");
    const failingFile = join(treeRoot, "00-failing.txt");
    const slowFile = join(treeRoot, "01-slow.txt");
    let releaseSlowStarted!: () => void;
    const slowStarted = new Promise<void>((resolvePromise) => {
      releaseSlowStarted = resolvePromise;
    });
    let isSlowStarted = false;
    let failReadOnce = true;
    let slowReadSettled = false;
    let activeReads = 0;
    let rollbackStartedWhileReadActive = false;
    let readFileMock: ReturnType<typeof vi.fn>;

    readFileMock = vi.fn(async (path: string | Buffer | URL) => {
      const absolute = resolve(path.toString());
      if (absolute !== failingFile && absolute !== slowFile) {
        return fs.readFile(path);
      }

      activeReads += 1;
      try {
        if (absolute === failingFile && failReadOnce) {
          failReadOnce = false;
          await Promise.race([slowStarted, delay(25)]);
          throw Object.assign(new Error("Injected tree read failure"), {
            code: "ENOENT",
          });
        }
        if (absolute === slowFile) {
          isSlowStarted = true;
          releaseSlowStarted();
          await delay(80);
          return await fs.readFile(path);
        }
        return await fs.readFile(path);
      } finally {
        activeReads -= 1;
        if (absolute === slowFile) slowReadSettled = true;
      }
    });
    const rmdirMock = vi.fn(async (path: string | Buffer | URL) => {
      if (resolve(path.toString()) === treeRoot && activeReads > 0) {
        rollbackStartedWhileReadActive = true;
      }
      await fs.rmdir(path);
    });

    vi.resetModules();
    vi.doMock("node:fs/promises", () => ({
      ...fs,
      readFile: readFileMock,
      rmdir: rmdirMock,
    }));
    try {
      const {
        recordTargetFile,
        recordTargetTreeIfExists,
        runInTargetTransaction,
      } = await import(
        "../../../packages/create-nextdevtpl/src/target-transaction"
      );

      await expect(
        runInTargetTransaction(target, false, identity, async () => {
          await fs.mkdir(treeRoot);
          await fs.writeFile(failingFile, "registered failing file", "utf8");
          await fs.writeFile(slowFile, "in-flight file", "utf8");
          await recordTargetFile(failingFile, "registered failing file");
          await recordTargetTreeIfExists(treeRoot);
        })
      ).rejects.toThrow();

      expect(isSlowStarted).toBe(true);
      expect(slowReadSettled).toBe(true);
      expect(rollbackStartedWhileReadActive).toBe(false);
      const completedReadCount = readFileMock.mock.calls.length;
      await delay(100);
      expect(readFileMock).toHaveBeenCalledTimes(completedReadCount);
      await expect(fs.readdir(target)).resolves.toEqual([]);
    } finally {
      vi.doUnmock("node:fs/promises");
      vi.resetModules();
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("keeps file reads concurrent but bounded to eight workers", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const { identity, root, target } = await createTarget(fs);
    const treeRoot = join(target, "tree");
    let activeReads = 0;
    let maximumActiveReads = 0;
    const readFileMock = vi.fn(async (path: string | Buffer | URL) => {
      const absolute = resolve(path.toString());
      if (
        !absolute.startsWith(
          `${treeRoot}${process.platform === "win32" ? "\\" : "/"}`
        )
      ) {
        return fs.readFile(path);
      }
      activeReads += 1;
      maximumActiveReads = Math.max(maximumActiveReads, activeReads);
      try {
        await delay(10);
        return await fs.readFile(path);
      } finally {
        activeReads -= 1;
      }
    });

    vi.resetModules();
    vi.doMock("node:fs/promises", () => ({ ...fs, readFile: readFileMock }));
    try {
      const { recordTargetTree, runInTargetTransaction } = await import(
        "../../../packages/create-nextdevtpl/src/target-transaction"
      );
      await runInTargetTransaction(target, false, identity, async () => {
        await fs.mkdir(treeRoot);
        await Promise.all(
          Array.from({ length: 20 }, (_, index) =>
            fs.writeFile(
              join(treeRoot, `file-${index}.txt`),
              `content-${index}`,
              "utf8"
            )
          )
        );
        await recordTargetTree(treeRoot);
      });

      expect(maximumActiveReads).toBeGreaterThan(1);
      expect(maximumActiveReads).toBeLessThanOrEqual(8);
    } finally {
      vi.doUnmock("node:fs/promises");
      vi.resetModules();
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("ignores a missing tree root", async () => {
    const fs =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises"
      );
    const { identity, root, target } = await createTarget(fs);
    vi.resetModules();
    try {
      const { recordTargetTreeIfExists, runInTargetTransaction } = await import(
        "../../../packages/create-nextdevtpl/src/target-transaction"
      );
      await runInTargetTransaction(target, false, identity, async () => {
        await recordTargetTreeIfExists(join(target, "missing"));
      });
      await expect(fs.readdir(target)).resolves.toEqual([]);
    } finally {
      vi.resetModules();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
