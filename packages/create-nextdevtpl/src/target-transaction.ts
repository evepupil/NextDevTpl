import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  realpath,
  rm,
  rmdir,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { GeneratorError } from "./generator-error.js";

interface TargetTransaction {
  created: boolean;
  dev: number;
  files: Map<string, { dev: number; ino: number; hash: string }>;
  links: Map<string, { dev: number; ino: number; target: string }>;
  ino: number;
  path: string;
  realPath: string;
  directories: Map<string, { dev: number; ino: number }>;
}

interface ValidatedDirectory {
  dev: number;
  ino: number;
  path: string;
}

interface ValidatedTargetPath {
  directories: ValidatedDirectory[];
  transaction: TargetTransaction;
}

export interface TargetIdentity {
  dev: number;
  ino: number;
  realPath: string;
}

const TARGET_TREE_SCAN_CONCURRENCY = 8;

const activeTransaction = new AsyncLocalStorage<TargetTransaction>();

function digest(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function inside(target: string, path: string): boolean {
  const relativePath = relative(target, path);
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) &&
      !relativePath.startsWith(`..${sep}`) &&
      relativePath !== "..")
  );
}

export async function runInTargetTransaction<T>(
  target: string,
  created: boolean,
  expectedIdentity: TargetIdentity,
  task: () => Promise<T>
): Promise<T> {
  const path = resolve(target);
  const stat = await lstat(path).catch(() => null);
  if (
    !stat ||
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    stat.dev !== expectedIdentity.dev ||
    stat.ino !== expectedIdentity.ino ||
    (await realpath(path)) !== expectedIdentity.realPath
  ) {
    throw new GeneratorError("Generation target changed before writing");
  }
  if ((await readdir(path)).length > 0) {
    throw new GeneratorError("Generation target changed before writing");
  }
  const transaction: TargetTransaction = {
    created,
    dev: expectedIdentity.dev,
    files: new Map(),
    links: new Map(),
    ino: expectedIdentity.ino,
    path,
    realPath: expectedIdentity.realPath,
    directories: new Map(),
  };
  try {
    return await activeTransaction.run(transaction, task);
  } catch (error) {
    await rollback(transaction);
    throw error;
  }
}

export async function recordTargetFile(
  path: string,
  content: Buffer | string
): Promise<void> {
  const absolute = resolve(path);
  const validation = await validateTargetPath(absolute);
  if (!validation) return;
  const stat = await lstat(absolute);
  if (!stat.isFile()) return;
  recordValidatedDirectories(validation);
  validation.transaction.files.set(absolute, {
    dev: stat.dev,
    ino: stat.ino,
    hash: digest(content),
  });
}

async function assertTransactionIdentity(
  transaction: TargetTransaction
): Promise<void> {
  const stat = await lstat(transaction.path).catch(() => null);
  if (
    !stat ||
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    stat.dev !== transaction.dev ||
    stat.ino !== transaction.ino ||
    (await realpath(transaction.path)) !== transaction.realPath
  ) {
    throw new GeneratorError("Generation target changed during delivery");
  }
}

export async function assertTargetIdentity(): Promise<void> {
  const transaction = activeTransaction.getStore();
  if (!transaction) return;
  await assertTransactionIdentity(transaction);
}

async function validateTargetPath(
  path: string,
  transaction = activeTransaction.getStore()
): Promise<ValidatedTargetPath | null> {
  if (!transaction) return null;
  const absolute = resolve(path);
  if (!inside(transaction.path, absolute)) return null;
  await assertTransactionIdentity(transaction);
  let directory = dirname(absolute);
  const ancestors: string[] = [];
  while (inside(transaction.path, directory)) {
    ancestors.push(directory);
    if (directory === transaction.path) break;
    directory = dirname(directory);
  }
  const validatedDirectories: ValidatedDirectory[] = [];
  for (const ancestor of ancestors.reverse()) {
    const stat = await lstat(ancestor).catch(() => null);
    const expected = transaction.directories.get(ancestor);
    if (
      !stat ||
      stat.isSymbolicLink() ||
      !stat.isDirectory() ||
      (expected && (stat.dev !== expected.dev || stat.ino !== expected.ino))
    ) {
      throw new GeneratorError("Generation target changed; cleanup stopped");
    }
    validatedDirectories.push({
      path: ancestor,
      dev: stat.dev,
      ino: stat.ino,
    });
  }
  return { directories: validatedDirectories, transaction };
}

function recordValidatedDirectories(validation: ValidatedTargetPath): void {
  for (const directory of validation.directories) {
    if (directory.path === validation.transaction.path) continue;
    validation.transaction.directories.set(directory.path, {
      dev: directory.dev,
      ino: directory.ino,
    });
  }
}

function sameDirectoryChain(
  left: readonly ValidatedDirectory[],
  right: readonly ValidatedDirectory[]
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (directory, index) =>
        directory.path === right[index]?.path &&
        directory.dev === right[index]?.dev &&
        directory.ino === right[index]?.ino
    )
  );
}

export async function assertTargetPath(path: string): Promise<void> {
  await validateTargetPath(path);
}

async function recordScannedFile(
  path: string,
  initialStat: Awaited<ReturnType<typeof lstat>>,
  initialValidation: ValidatedTargetPath
): Promise<void> {
  const content = await readFile(path);
  const finalValidation = await validateTargetPath(
    path,
    initialValidation.transaction
  );
  const finalStat = await lstat(path);
  if (
    !finalValidation ||
    !sameDirectoryChain(
      initialValidation.directories,
      finalValidation.directories
    ) ||
    !finalStat.isFile() ||
    finalStat.isSymbolicLink() ||
    finalStat.dev !== initialStat.dev ||
    finalStat.ino !== initialStat.ino
  ) {
    throw new GeneratorError("Generation target changed; cleanup stopped");
  }

  recordValidatedDirectories(finalValidation);
  finalValidation.transaction.files.set(path, {
    dev: finalStat.dev,
    ino: finalStat.ino,
    hash: digest(content),
  });
}

async function recordTargetTreeEntry(
  path: string,
  transaction: TargetTransaction
): Promise<string[]> {
  const absolute = resolve(path);
  const validation = await validateTargetPath(absolute, transaction);
  if (!validation) return [];
  const stat = await lstat(absolute);
  recordValidatedDirectories(validation);
  if (stat.isDirectory()) {
    transaction.directories.set(absolute, { dev: stat.dev, ino: stat.ino });
    return (await readdir(absolute)).map((name) => resolve(absolute, name));
  } else if (stat.isFile()) {
    await recordScannedFile(absolute, stat, validation);
  } else if (stat.isSymbolicLink()) {
    transaction.links.set(absolute, {
      dev: stat.dev,
      ino: stat.ino,
      target: await readlink(absolute),
    });
  }
  return [];
}

async function recordTargetTreeContents(
  root: string,
  transaction: TargetTransaction
): Promise<void> {
  const queue = [root];
  const waiters = new Set<() => void>();
  let nextIndex = 0;
  let active = 0;
  let generation = 0;
  let hasError = false;
  let firstError: unknown;

  const notifyWorkers = () => {
    generation += 1;
    for (const wake of waiters) wake();
    waiters.clear();
  };

  const worker = async (): Promise<void> => {
    while (!hasError) {
      if (nextIndex < queue.length) {
        const path = queue[nextIndex++]!;
        active += 1;
        try {
          const children = await recordTargetTreeEntry(path, transaction);
          if (!hasError && children.length > 0) queue.push(...children);
        } catch (error) {
          if (!hasError) {
            hasError = true;
            firstError = error;
          }
        } finally {
          active -= 1;
          notifyWorkers();
        }
        continue;
      }

      if (active === 0) return;
      const observedGeneration = generation;
      await new Promise<void>((resolvePromise) => {
        if (
          generation !== observedGeneration ||
          hasError ||
          nextIndex < queue.length ||
          active === 0
        ) {
          resolvePromise();
        } else {
          waiters.add(resolvePromise);
        }
      });
    }
  };

  await Promise.all(
    Array.from({ length: TARGET_TREE_SCAN_CONCURRENCY }, () => worker())
  );
  if (hasError) throw firstError;
}

export async function recordTargetTree(path: string): Promise<void> {
  const transaction = activeTransaction.getStore();
  if (!transaction) return;
  const absolute = resolve(path);
  if (!inside(transaction.path, absolute)) return;
  await recordTargetTreeContents(absolute, transaction);
}

export async function recordTargetTreeIfExists(path: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  await recordTargetTree(path);
}

export async function recordTargetFileIfExists(path: string): Promise<void> {
  try {
    await assertTargetPath(path);
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new GeneratorError("Generation target changed; cleanup stopped");
    }
    await recordTargetFile(path, await readFile(path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function forgetTargetPath(path: string): void {
  const transaction = activeTransaction.getStore();
  if (!transaction) return;
  const absolute = resolve(path);
  for (const file of transaction.files.keys()) {
    if (inside(absolute, file)) transaction.files.delete(file);
  }
  for (const link of transaction.links.keys()) {
    if (inside(absolute, link)) transaction.links.delete(link);
  }
  for (const directory of transaction.directories.keys()) {
    if (inside(absolute, directory)) transaction.directories.delete(directory);
  }
}

export function isPathInActiveTarget(path: string): boolean {
  const transaction = activeTransaction.getStore();
  return Boolean(transaction && inside(transaction.path, resolve(path)));
}

async function rollback(transaction: TargetTransaction): Promise<void> {
  const absolute = transaction.path;
  const stat = await lstat(absolute).catch(() => null);
  if (
    !stat ||
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    stat.dev !== transaction.dev ||
    stat.ino !== transaction.ino ||
    (await realpath(absolute)) !== transaction.realPath
  ) {
    throw new GeneratorError("Generation target changed; cleanup stopped");
  }
  for (const [path, expected] of [...transaction.files.entries()].reverse()) {
    try {
      if (!(await assertRollbackPath(transaction, path))) continue;
      const fileStat = await lstat(path);
      if (
        fileStat.isFile() &&
        fileStat.dev === expected.dev &&
        fileStat.ino === expected.ino &&
        digest(await readFile(path)) === expected.hash
      ) {
        await rm(path);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  for (const [path, expected] of [...transaction.links.entries()].reverse()) {
    try {
      if (!(await assertRollbackPath(transaction, path))) continue;
      const linkStat = await lstat(path);
      if (
        linkStat.isSymbolicLink() &&
        linkStat.dev === expected.dev &&
        linkStat.ino === expected.ino &&
        (await readlink(path)) === expected.target
      ) {
        await rm(path);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  let retainedUntrackedFiles = false;
  for (const [directory, expected] of [
    ...transaction.directories.entries(),
  ].sort((left, right) => right[0].length - left[0].length)) {
    if (!(await assertRollbackPath(transaction, directory))) continue;
    const directoryStat = await lstat(directory).catch(() => null);
    if (!directoryStat) continue;
    if (
      !directoryStat.isDirectory() ||
      directoryStat.isSymbolicLink() ||
      directoryStat.dev !== expected.dev ||
      directoryStat.ino !== expected.ino
    ) {
      retainedUntrackedFiles = true;
      continue;
    }
    await rmdir(directory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOTEMPTY") retainedUntrackedFiles = true;
      else if (error.code !== "ENOENT") throw error;
    });
  }
  if (transaction.created) {
    await assertTargetIdentity();
    await rmdir(absolute).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOTEMPTY") retainedUntrackedFiles = true;
      else if (error.code !== "ENOENT") throw error;
    });
  } else if ((await readdir(absolute)).length > 0) {
    retainedUntrackedFiles = true;
  }
  if (retainedUntrackedFiles) {
    throw new GeneratorError(
      "Generation failed; untracked files were retained in target"
    );
  }
}

async function assertRollbackPath(
  transaction: TargetTransaction,
  path: string
): Promise<boolean> {
  const absolute = resolve(path);
  const stat = await lstat(transaction.path).catch(() => null);
  if (
    !stat ||
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    stat.dev !== transaction.dev ||
    stat.ino !== transaction.ino ||
    (await realpath(transaction.path)) !== transaction.realPath
  ) {
    throw new GeneratorError("Generation target changed; cleanup stopped");
  }
  let directory = dirname(absolute);
  const ancestors: string[] = [];
  while (inside(transaction.path, directory)) {
    ancestors.push(directory);
    if (directory === transaction.path) break;
    directory = dirname(directory);
  }
  for (const ancestor of ancestors.reverse()) {
    const directoryStat = await lstat(ancestor).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      }
    );
    if (!directoryStat) return false;
    const expected = transaction.directories.get(ancestor);
    if (
      directoryStat.isSymbolicLink() ||
      !directoryStat.isDirectory() ||
      (expected &&
        (directoryStat.dev !== expected.dev ||
          directoryStat.ino !== expected.ino))
    ) {
      throw new GeneratorError("Generation target changed; cleanup stopped");
    }
  }
  return true;
}

export async function rollbackTargetTransaction(
  target: string
): Promise<boolean> {
  const transaction = activeTransaction.getStore();
  if (!transaction || transaction.path !== resolve(target)) return false;
  await rollback(transaction);
  return true;
}

export async function ensureTrackedDirectory(path: string): Promise<void> {
  await assertTargetPath(path);
  await mkdir(path);
  const transaction = activeTransaction.getStore();
  if (transaction && inside(transaction.path, resolve(path))) {
    const absolute = resolve(path);
    const stat = await lstat(absolute);
    transaction.directories.set(absolute, { dev: stat.dev, ino: stat.ino });
  }
}
