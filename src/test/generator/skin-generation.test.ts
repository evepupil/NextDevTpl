import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { generateProject } from "../../../packages/create-nextdevtpl/src/generate";
import type { GeneratorTestHooks } from "../../../packages/create-nextdevtpl/src/generator-internals";
import {
  readSkinManifest,
  refreshSkinFileHashes,
} from "../../../packages/create-nextdevtpl/src/skins";
import { calculateSkinPackageHash } from "../../../packages/create-nextdevtpl/src/skins/hash";
import type { RemoteSkinSourceSelection } from "../../../packages/create-nextdevtpl/src/skins/source-types";
import type { SkinManifest } from "../../../packages/create-nextdevtpl/src/skins/types";
import type { LocalHttpsFixture } from "../skins/https-fixture";
import {
  archiveDigest,
  makeArchive,
  startLocalHttps,
} from "../skins/https-fixture";

const DEFAULT_SKIN_DIRECTORY = resolve(process.cwd(), "src", "skin");
const parseYaml = (
  createRequire(
    resolve(process.cwd(), "packages", "create-nextdevtpl", "package.json")
  )("yaml") as { parse(input: string): unknown }
).parse;

interface RemoteSkinFixture {
  archive: Buffer;
  requests: Array<{
    authorization: string | undefined;
    path: string | undefined;
  }>;
  selection: RemoteSkinSourceSelection;
  server: LocalHttpsFixture;
  tempDirectory: string;
  url: string;
}

interface TargetIdentity {
  dev: number;
  ino: number;
}

let testRoot: string;
let defaultSkinPackageHash: string;
let remoteFixtureId = 0;
const activeServers: LocalHttpsFixture[] = [];

async function createRemoteSkinFixture(
  skinDirectory: string,
  tokenEnv?: string
): Promise<RemoteSkinFixture> {
  const manifest = await readSkinManifest(skinDirectory);
  const paths = ["skin.json", ...Object.keys(manifest.files)];
  const archive = await makeArchive(
    await Promise.all(
      paths.map(async (path) => ({
        name: path,
        body: await readFile(join(skinDirectory, ...path.split("/"))),
      }))
    )
  );
  const requests: RemoteSkinFixture["requests"] = [];
  const server = await startLocalHttps((request, response) => {
    requests.push({
      authorization: request.headers.authorization,
      path: request.url,
    });
    response.writeHead(200, { "content-type": "application/gzip" });
    response.end(archive);
  });
  activeServers.push(server);

  const tempDirectory = join(testRoot, `remote-source-${remoteFixtureId++}`);
  await mkdir(tempDirectory);
  const url = `${server.origin}/skin.tgz`;
  return {
    archive,
    requests,
    selection: {
      kind: "remote",
      url,
      sha256: archiveDigest(archive),
      ...(tokenEnv ? { tokenEnv } : {}),
    },
    server,
    tempDirectory,
    url,
  };
}

async function createSkinWithAdditionalDependency(
  directory: string
): Promise<{ directory: string; packageName: string; version: string }> {
  await cp(DEFAULT_SKIN_DIRECTORY, directory, { recursive: true });
  const manifest = await readSkinManifest(directory);
  const packageName = "react-icons";
  const version = "5.5.0";
  const updatedManifest: SkinManifest = {
    ...manifest,
    dependencies: { ...manifest.dependencies, [packageName]: version },
    assets: [
      ...manifest.assets,
      {
        id: "additional-icon-package",
        kind: "dependency",
        author: "react-icons contributors",
        source: "https://github.com/react-icons/react-icons",
        license: "MIT",
        purpose: "visual",
        package: { name: packageName, version },
      },
    ],
  };

  const viewPath = join(directory, "views", "shared", "empty-dashboard.tsx");
  const view = await readFile(viewPath, "utf8");
  const importedView = view.replace(
    'import { getTranslations } from "next-intl/server";',
    'import { getTranslations } from "next-intl/server";\nimport { HiHome } from "react-icons/hi2";'
  );
  const updatedView = importedView.replace(
    '<h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>',
    '<h1 className="text-2xl font-bold tracking-tight"><HiHome aria-hidden /> {t("title")}</h1>'
  );
  if (importedView === view || updatedView === importedView) {
    throw new Error("Default shared view no longer matches the fixture edits");
  }
  await writeFile(viewPath, updatedView, "utf8");

  await writeFile(
    join(directory, "skin.json"),
    JSON.stringify(updatedManifest, null, 2),
    "utf8"
  );
  await refreshSkinFileHashes(directory);
  return { directory, packageName, version };
}

async function targetIdentity(path: string): Promise<TargetIdentity> {
  const stat = await lstat(path);
  return { dev: stat.dev, ino: stat.ino };
}

async function expectSameTargetIdentity(
  path: string,
  identity: TargetIdentity
): Promise<void> {
  await expect(targetIdentity(path)).resolves.toEqual(identity);
}

async function expectNoStageDirectories(parent: string): Promise<void> {
  const entries = await readdir(parent);
  expect(
    entries.filter((entry) => entry.startsWith(".nextdevtpl-stage-"))
  ).toEqual([]);
}

async function expectPrunedSkinFingerprint(
  target: string,
  rawPackageHash: string,
  selectedModules: readonly string[]
): Promise<void> {
  const outputDirectory = join(target, "src", "skin");
  const outputManifest = await readSkinManifest(outputDirectory);
  const outputPackageHash = await calculateSkinPackageHash(
    outputDirectory,
    outputManifest
  );

  expect(outputManifest.modules).toEqual(selectedModules);
  expect(outputPackageHash).not.toBe(rawPackageHash);
}

async function targetDirectoryIsAbsent(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }
}

beforeAll(async () => {
  testRoot = await mkdtemp(join(tmpdir(), "nextdevtpl-skin-generation-"));
  const manifest = await readSkinManifest(DEFAULT_SKIN_DIRECTORY);
  defaultSkinPackageHash = await calculateSkinPackageHash(
    DEFAULT_SKIN_DIRECTORY,
    manifest
  );
});

afterEach(async () => {
  vi.unstubAllEnvs();
  for (const server of activeServers.splice(0)) await server.close();
});

afterAll(async () => {
  await rm(testRoot, { recursive: true, force: true });
});

describe("skin generation source records and transaction rollback", () => {
  it("records the built-in skin source and keeps raw and pruned hashes separate", async () => {
    vi.stubEnv("NEXTDEVTPL_SKIN_TOKEN", "");
    const builtinTarget = join(testRoot, "source-record-builtin");
    const builtin = await generateProject({
      targetDirectory: builtinTarget,
      preset: "minimal",
      install: false,
    });
    expect(builtin.manifest.skin.source).toEqual({
      kind: "builtin",
      id: "default",
    });
    expect(builtin.manifest.skin.packageHash).toBe(defaultSkinPackageHash);
    await expectPrunedSkinFingerprint(
      builtinTarget,
      defaultSkinPackageHash,
      builtin.manifest.modules
    );
  });

  it("records a local skin source without exposing its path", async () => {
    const localTarget = join(testRoot, "source-record-local");
    const local = await generateProject({
      targetDirectory: localTarget,
      preset: "minimal",
      skin: { kind: "local", directory: DEFAULT_SKIN_DIRECTORY },
      install: false,
    });
    expect(local.manifest.skin.source).toEqual({ kind: "local" });
    expect(local.manifest.skin.packageHash).toBe(defaultSkinPackageHash);
    expect(JSON.stringify(local.manifest.skin)).not.toContain(
      DEFAULT_SKIN_DIRECTORY
    );
    await expectPrunedSkinFingerprint(
      localTarget,
      defaultSkinPackageHash,
      local.manifest.modules
    );
  });

  it("records a remote skin source and releases its download connection", async () => {
    const remote = await createRemoteSkinFixture(DEFAULT_SKIN_DIRECTORY);
    await writeFile(join(remote.tempDirectory, "neighbor.txt"), "keep", "utf8");
    const remoteTarget = join(testRoot, "source-record-remote");
    const downloaded = await generateProject(
      {
        targetDirectory: remoteTarget,
        preset: "minimal",
        skin: remote.selection,
        install: false,
      },
      {
        sourceOptions: {
          ca: remote.server.ca,
          tempDirectory: remote.tempDirectory,
        },
      }
    );
    expect(downloaded.manifest.skin.source).toEqual({
      kind: "remote",
      archiveSha256: archiveDigest(remote.archive),
    });
    expect(downloaded.manifest.skin.packageHash).toBe(defaultSkinPackageHash);
    expect(JSON.stringify(downloaded.manifest.skin)).not.toContain(remote.url);
    await expectPrunedSkinFingerprint(
      remoteTarget,
      defaultSkinPackageHash,
      downloaded.manifest.modules
    );
    await expect(readdir(remote.tempDirectory)).resolves.toEqual([
      "neighbor.txt",
    ]);
    expect(remote.requests).toEqual([
      { authorization: undefined, path: "/skin.tgz" },
    ]);
    await expect
      .poll(() => remote.server.connections(), { interval: 25, timeout: 2_000 })
      .toBe(0);
  });

  it("uses no child process when the default skin lockfile can be reused", async () => {
    const target = join(testRoot, "default-lock-reuse");
    const calls: Array<{ args: readonly string[]; command: string }> = [];

    await generateProject(
      { targetDirectory: target, preset: "minimal", install: false },
      {
        runProcess: async (command, args) => {
          calls.push({ command, args });
        },
      }
    );

    expect(calls).toEqual([]);
    expect(await targetDirectoryIsAbsent(join(target, "node_modules"))).toBe(
      true
    );
    expect(await targetDirectoryIsAbsent(join(target, "drizzle"))).toBe(true);
    expect(await readFile(join(target, "pnpm-lock.yaml"), "utf8")).not.toBe("");
  });

  it("runs lock-only for a new reachable skin dependency and strips tokens from every child", async () => {
    const modifiedSkin = await createSkinWithAdditionalDependency(
      join(testRoot, "skin-with-new-dependency")
    );
    const remote = await createRemoteSkinFixture(
      modifiedSkin.directory,
      "M3_CUSTOM_SKIN_TOKEN"
    );
    const defaultToken = "m3-default-token-secret";
    const customToken = "m3-custom-token-secret";
    vi.stubEnv("NEXTDEVTPL_SKIN_TOKEN", defaultToken);
    vi.stubEnv("M3_CUSTOM_SKIN_TOKEN", customToken);

    const lockOnlyTarget = join(testRoot, "new-dependency-no-install");
    const lockOnlyCalls: Array<{
      args: readonly string[];
      command: string;
      env: NodeJS.ProcessEnv;
    }> = [];
    await generateProject(
      {
        targetDirectory: lockOnlyTarget,
        preset: "minimal",
        target: "cloudflare",
        skin: remote.selection,
        install: false,
      },
      {
        sourceOptions: {
          ca: remote.server.ca,
          tempDirectory: remote.tempDirectory,
        },
        runProcess: async (command, args, options) => {
          lockOnlyCalls.push({ command, args, env: options.env });
        },
      }
    );

    expect(lockOnlyCalls).toHaveLength(1);
    expect(lockOnlyCalls[0]?.args).toEqual([
      "install",
      "--lockfile-only",
      "--ignore-scripts",
      "--prefer-offline",
      "--ignore-workspace",
    ]);
    expect(
      await targetDirectoryIsAbsent(join(lockOnlyTarget, "node_modules"))
    ).toBe(true);
    const lockOnlyPackageJson = JSON.parse(
      await readFile(join(lockOnlyTarget, "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };
    const lockOnlyFile = parseYaml(
      await readFile(join(lockOnlyTarget, "pnpm-lock.yaml"), "utf8")
    ) as {
      importers?: Record<string, { dependencies?: Record<string, unknown> }>;
    };
    expect(lockOnlyPackageJson.dependencies[modifiedSkin.packageName]).toBe(
      modifiedSkin.version
    );
    const lockOnlySkin = await readSkinManifest(
      join(lockOnlyTarget, "src", "skin")
    );
    expect(lockOnlySkin.dependencies[modifiedSkin.packageName]).toBe(
      modifiedSkin.version
    );
    expect(
      lockOnlyFile.importers?.["."]?.dependencies?.[modifiedSkin.packageName]
    ).toBeUndefined();

    const fullInstallTarget = join(testRoot, "new-dependency-full-install");
    const fullInstallCalls: Array<{
      args: readonly string[];
      command: string;
      env: NodeJS.ProcessEnv;
    }> = [];
    await generateProject(
      {
        targetDirectory: fullInstallTarget,
        preset: "minimal",
        target: "cloudflare",
        skin: remote.selection,
        install: true,
      },
      {
        sourceOptions: {
          ca: remote.server.ca,
          tempDirectory: remote.tempDirectory,
        },
        runProcess: async (command, args, options) => {
          fullInstallCalls.push({ command, args, env: options.env });
        },
      }
    );

    expect(fullInstallCalls.map(({ args }) => args)).toEqual([
      [
        "install",
        "--lockfile-only",
        "--ignore-scripts",
        "--prefer-offline",
        "--ignore-workspace",
      ],
      ["install", "--ignore-workspace"],
      ["run", "db:generate:init"],
      ["run", "cf:types"],
    ]);
    const fullInstallPackageJson = JSON.parse(
      await readFile(join(fullInstallTarget, "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };
    expect(fullInstallPackageJson.dependencies[modifiedSkin.packageName]).toBe(
      modifiedSkin.version
    );
    for (const call of [...lockOnlyCalls, ...fullInstallCalls]) {
      const environmentNames = Object.keys(call.env).map((name) =>
        name.toLowerCase()
      );
      expect(environmentNames).not.toContain("nextdevtpl_skin_token");
      expect(environmentNames).not.toContain("m3_custom_skin_token");
      expect(JSON.stringify(call)).not.toContain(defaultToken);
      expect(JSON.stringify(call)).not.toContain(customToken);
    }
    expect(remote.requests).toEqual([
      { authorization: `Bearer ${customToken}`, path: "/skin.tgz" },
      { authorization: `Bearer ${customToken}`, path: "/skin.tgz" },
    ]);
    expect(await readdir(remote.tempDirectory)).toEqual([]);
    expect(JSON.stringify(fullInstallCalls)).not.toContain(remote.url);
    expect(
      await targetDirectoryIsAbsent(join(lockOnlyTarget, "node_modules"))
    ).toBe(true);
    expect(
      await targetDirectoryIsAbsent(join(fullInstallTarget, "node_modules"))
    ).toBe(true);
    await expect
      .poll(() => remote.server.connections(), { interval: 25, timeout: 2_000 })
      .toBe(0);
  });

  it("releases a remote source after target preflight rejects a non-empty directory", async () => {
    const remote = await createRemoteSkinFixture(DEFAULT_SKIN_DIRECTORY);
    const target = join(testRoot, "occupied-target");
    await mkdir(target);
    await writeFile(join(target, "keep.txt"), "existing", "utf8");
    await writeFile(
      join(remote.tempDirectory, "neighbor.txt"),
      "neighbor",
      "utf8"
    );
    const identity = await targetIdentity(target);

    await expect(
      generateProject(
        {
          targetDirectory: target,
          preset: "minimal",
          skin: remote.selection,
          install: false,
        },
        {
          sourceOptions: {
            ca: remote.server.ca,
            tempDirectory: remote.tempDirectory,
          },
        }
      )
    ).rejects.toThrow();

    await expectSameTargetIdentity(target, identity);
    await expect(readFile(join(target, "keep.txt"), "utf8")).resolves.toBe(
      "existing"
    );
    await expect(readdir(remote.tempDirectory)).resolves.toEqual([
      "neighbor.txt",
    ]);
    await expectNoStageDirectories(testRoot);
    await expect
      .poll(() => remote.server.connections(), { interval: 25, timeout: 2_000 })
      .toBe(0);
  });

  it("removes a failed new target and its private stage while preserving siblings", async () => {
    const target = join(testRoot, "new-target");
    const sibling = join(testRoot, "sibling.txt");
    await writeFile(sibling, "keep", "utf8");
    let failedAfterNestedFile = false;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "minimal", install: false },
        {
          afterStageFileDelivered: async (relativePath) => {
            if (!failedAfterNestedFile && relativePath.includes(sep)) {
              failedAfterNestedFile = true;
              throw new Error("injected delivery failure");
            }
          },
        }
      )
    ).rejects.toThrow();

    expect(failedAfterNestedFile).toBe(true);
    expect(await targetDirectoryIsAbsent(target)).toBe(true);
    await expect(readFile(sibling, "utf8")).resolves.toBe("keep");
    await expectNoStageDirectories(testRoot);
  });

  it("preserves a newly added external file and the identity of an existing empty target", async () => {
    const target = join(testRoot, "external-file-target");
    await mkdir(target);
    const identity = await targetIdentity(target);
    const externalFile = join(target, "external.txt");
    let injected = false;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "minimal", install: false },
        {
          afterStageFileDelivered: async () => {
            if (injected) return;
            injected = true;
            await writeFile(externalFile, "outside generation", "utf8");
            throw new Error("injected external file");
          },
        }
      )
    ).rejects.toThrow();

    await expectSameTargetIdentity(target, identity);
    await expect(readFile(externalFile, "utf8")).resolves.toBe(
      "outside generation"
    );
    await expectNoStageDirectories(testRoot);
  });

  it("preserves an externally rewritten generated file", async () => {
    const target = join(testRoot, "rewritten-file-target");
    await mkdir(target);
    const identity = await targetIdentity(target);
    let rewrittenFile: string | undefined;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "minimal", install: false },
        {
          afterStageFileDelivered: async (relativePath) => {
            if (rewrittenFile) return;
            rewrittenFile = join(target, ...relativePath.split("/"));
            await writeFile(rewrittenFile, "external rewrite", "utf8");
            throw new Error("injected external rewrite");
          },
        }
      )
    ).rejects.toThrow();

    expect(rewrittenFile).toBeDefined();
    await expectSameTargetIdentity(target, identity);
    await expect(readFile(rewrittenFile!, "utf8")).resolves.toBe(
      "external rewrite"
    );
    await expectNoStageDirectories(testRoot);
  });

  it("stops rollback when the public target directory is replaced", async () => {
    const target = join(testRoot, "replaced-target");
    const renamedOriginal = join(testRoot, "renamed-original-target");
    await mkdir(target);
    let replaced = false;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "minimal", install: false },
        {
          afterStageFileDelivered: async () => {
            if (replaced) return;
            replaced = true;
            await rename(target, renamedOriginal);
            await mkdir(target);
            await writeFile(join(target, "replacement.txt"), "keep", "utf8");
            throw new Error("injected target replacement");
          },
        }
      )
    ).rejects.toThrow();

    await expect(
      readFile(join(target, "replacement.txt"), "utf8")
    ).resolves.toBe("keep");
    expect((await readdir(renamedOriginal)).length).toBeGreaterThan(0);
    await expectNoStageDirectories(testRoot);
  });

  it("preserves a renamed directory and its replacement junction target", async () => {
    const target = join(testRoot, "replaced-nested-directory-target");
    const originalDirectory = join(target, "src", "skin", "views", "shared");
    const preservedDirectory = join(
      target,
      "src",
      "skin",
      "views",
      "shared-original"
    );
    const externalDirectory = join(testRoot, "external-shared-directory");
    await mkdir(target);

    let swapped = false;
    let originalIdentity: TargetIdentity | undefined;
    let externalIdentity: TargetIdentity | undefined;
    let sentinelPath: string | undefined;
    let originalFilePath: string | undefined;
    let sentinelContents: Buffer | undefined;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "minimal", install: false },
        {
          afterStageFileDelivered: async (relativePath) => {
            const parts = relativePath.split(/[\\/]/u);
            if (
              swapped ||
              parts.length <= 4 ||
              parts.slice(0, 4).join("/") !== "src/skin/views/shared"
            ) {
              return;
            }

            const sharedRelativePath = parts.slice(4);
            await rename(originalDirectory, preservedDirectory);
            originalIdentity = await targetIdentity(preservedDirectory);
            originalFilePath = join(preservedDirectory, ...sharedRelativePath);
            sentinelContents = await readFile(originalFilePath);
            await cp(preservedDirectory, externalDirectory, {
              recursive: true,
            });
            externalIdentity = await targetIdentity(externalDirectory);
            sentinelPath = join(externalDirectory, ...sharedRelativePath);
            await symlink(
              externalDirectory,
              originalDirectory,
              process.platform === "win32" ? "junction" : "dir"
            );
            swapped = true;
            throw new Error("injected nested directory replacement");
          },
        }
      )
    ).rejects.toThrow();

    expect(swapped).toBe(true);
    expect(originalIdentity).toBeDefined();
    expect(externalIdentity).toBeDefined();
    expect(sentinelPath).toBeDefined();
    expect(originalFilePath).toBeDefined();
    expect(sentinelContents).toBeDefined();
    expect(externalIdentity).not.toEqual(originalIdentity);
    await expect(readFile(originalFilePath!)).resolves.toEqual(
      sentinelContents
    );
    await expect(readFile(sentinelPath!)).resolves.toEqual(sentinelContents);
    await expect(targetIdentity(preservedDirectory)).resolves.toEqual(
      originalIdentity
    );
    await expect(targetIdentity(externalDirectory)).resolves.toEqual(
      externalIdentity
    );
    expect((await lstat(originalDirectory)).isSymbolicLink()).toBe(true);
    await expectNoStageDirectories(testRoot);
  });

  it("removes install postinstall metadata when migration generation fails", async () => {
    const target = join(testRoot, "saas-postinstall-rollback");
    await mkdir(target);
    const identity = await targetIdentity(target);
    let postinstallOutputCreated = false;
    let migrationFailed = false;

    await expect(
      generateProject(
        { targetDirectory: target, preset: "saas", install: true },
        {
          runProcess: async (_command, args, { cwd }) => {
            if (args.includes("--lockfile-only")) return;
            if (args[0] === "install") {
              const sourceDirectory = join(cwd, ".source");
              await mkdir(sourceDirectory);
              await writeFile(
                join(sourceDirectory, "server.ts"),
                "postinstall output",
                "utf8"
              );
              postinstallOutputCreated = true;
              return;
            }
            if (args[0] === "run" && args[1] === "db:generate:init") {
              migrationFailed = true;
              throw new Error("injected migration failure");
            }
          },
        }
      )
    ).rejects.toThrow();

    expect(postinstallOutputCreated).toBe(true);
    expect(migrationFailed).toBe(true);
    await expectSameTargetIdentity(target, identity);
    await expect(readdir(target)).resolves.toEqual([]);
    expect(await targetDirectoryIsAbsent(join(target, ".source"))).toBe(true);
    await expectNoStageDirectories(testRoot);
  });

  it.each([
    "install",
    "migration",
    "cloudflare types",
  ] as const)("rolls back known outputs and preserves an external store when %s fails", async (failureStage) => {
    vi.stubEnv("CF_COMPATIBILITY_DATE", "");
    const target = join(testRoot, `process-failure-${failureStage}`);
    await mkdir(target);
    const identity = await targetIdentity(target);
    const outsideStore = join(testRoot, `outside-store-${failureStage}`);
    await mkdir(outsideStore);
    await writeFile(join(outsideStore, "keep.txt"), "outside", "utf8");
    const calls: Array<{ args: readonly string[]; cwd: string }> = [];
    const hooks: GeneratorTestHooks = {
      runProcess: async (_command, args, { cwd }) => {
        calls.push({ args, cwd });
        if (args.includes("--lockfile-only")) return;

        const step = args[0] === "run" ? args[1] : args[0];
        if (step === "install" && failureStage === "install") {
          const pnpmDirectory = join(cwd, "node_modules", ".pnpm");
          await mkdir(pnpmDirectory, { recursive: true });
          await writeFile(
            join(pnpmDirectory, "partial.txt"),
            "partial",
            "utf8"
          );
          await symlink(
            outsideStore,
            join(cwd, "node_modules", "outside-store"),
            process.platform === "win32" ? "junction" : "dir"
          );
          throw new Error(`injected ${failureStage} failure`);
        }

        if (step === "db:generate:init") {
          const migrationDirectory = join(cwd, "drizzle", "meta");
          await mkdir(migrationDirectory, { recursive: true });
          await writeFile(
            join(migrationDirectory, "partial.json"),
            "partial",
            "utf8"
          );
          if (failureStage === "migration") {
            throw new Error(`injected ${failureStage} failure`);
          }
        }

        if (step === "cf:types") {
          await writeFile(
            join(cwd, "worker-configuration.d.ts"),
            "partial",
            "utf8"
          );
          if (failureStage === "cloudflare types") {
            throw new Error(`injected ${failureStage} failure`);
          }
        }
      },
    };

    await expect(
      generateProject(
        {
          targetDirectory: target,
          preset: "minimal",
          target: "cloudflare",
          install: true,
        },
        hooks
      )
    ).rejects.toThrow();

    await expectSameTargetIdentity(target, identity);
    await expect(readdir(target)).resolves.toEqual([]);
    await expect(
      readFile(join(outsideStore, "keep.txt"), "utf8")
    ).resolves.toBe("outside");
    expect(calls.length).toBeGreaterThan(0);
    await expectNoStageDirectories(testRoot);
  });
});
