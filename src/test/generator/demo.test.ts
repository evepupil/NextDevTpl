import { createHash } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_DEMO_DATA,
  mergeDemoData,
  parseDemoDataPatch,
  serializeDemoData,
} from "@/core/skin/demo";
import { parseCliArguments } from "../../../packages/create-nextdevtpl/src/cli";
import { prepareDemoData } from "../../../packages/create-nextdevtpl/src/demo-generation";
import { generateProject } from "../../../packages/create-nextdevtpl/src/generate";
import {
  readSkinManifest,
  refreshSkinFileHashes,
} from "../../../packages/create-nextdevtpl/src/skins";
import type { GeneratorOptions } from "../../../packages/create-nextdevtpl/src/types";

let root: string;
let fixtureId = 0;

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function skinWithData(source: string) {
  const directory = join(root, `skin-${fixtureId++}`);
  await cp(resolve("src/skin"), directory, { recursive: true });
  await mkdir(join(directory, "demo"));
  await writeFile(join(directory, "demo/data.json"), source);
  const manifest = await readSkinManifest(directory);
  await writeFile(
    join(directory, "skin.json"),
    JSON.stringify({
      ...manifest,
      demo: { data: "demo/data.json" },
      files: {
        ...manifest.files,
        "demo/data.json": createHash("sha256").update(source).digest("hex"),
      },
    })
  );
  await refreshSkinFileHashes(directory);
  return { kind: "local" as const, directory };
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "nextdevtpl-demo-tests-"));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("纯前端导出参数和裁剪", () => {
  it("CLI保留皮肤配色与安装选项，并拒绝未知模式", () => {
    expect(
      parseCliArguments([
        "app",
        "--mode",
        "demo",
        "--palette",
        "glassmorphism",
        "--no-install",
      ])
    ).toMatchObject({ mode: "demo", palette: "glassmorphism", install: false });
    expect(() => parseCliArguments(["app", "--mode", "preview"])).toThrow();
  });

  it.each([
    { preset: "minimal" as const },
    { modules: [] },
    { adapterOverrides: {} },
    { target: "cloudflare" as const },
    { target: "docker" as const },
    { target: "vercel" as const },
  ])("演示版在创建目标前拒绝后端选项 %j", async (options) => {
    const targetDirectory = join(root, `invalid-${fixtureId++}`);
    await expect(
      generateProject({
        targetDirectory,
        mode: "demo",
        install: false,
        ...options,
      })
    ).rejects.toThrow();
    expect(await exists(targetDirectory)).toBe(false);
  });

  it("默认模式仍生成真实项目，并彻底删除演示实现", async () => {
    const targetDirectory = join(root, "default-full");
    const { manifest } = await generateProject({
      targetDirectory,
      preset: "minimal",
      install: false,
    });
    expect(manifest.mode).toBe("full");
    expect(manifest.modules).toContain("auth");
    expect(manifest).not.toHaveProperty("demo");
    expect(manifest).not.toHaveProperty("viewModules");
    expect(await exists(join(targetDirectory, "src/core/skin/demo"))).toBe(
      false
    );
    expect(
      await readFile(
        join(targetDirectory, "src/modules/app-runtime.tsx"),
        "utf8"
      )
    ).not.toContain("demo");
  });

  it("演示版记录八个视图模块且不带后端能力和私密数据", async () => {
    const targetDirectory = join(root, "default-demo");
    const { manifest } = await generateProject({
      targetDirectory,
      mode: "demo",
      install: false,
    });
    expect(manifest.mode).toBe("demo");
    expect(manifest.modules).toEqual([]);
    expect(manifest.adapters).toEqual({});
    expect(manifest.bindings).toEqual([]);
    expect(manifest.viewModules?.length).toBe(8);
    expect(manifest.demo?.dataSha256).toBe(
      createHash("sha256")
        .update(serializeDemoData(DEFAULT_DEMO_DATA))
        .digest("hex")
    );
    expect(JSON.stringify(manifest)).not.toContain(
      DEFAULT_DEMO_DATA.workspace.user.email
    );
    for (const path of [
      "src/app/api",
      "src/db",
      "src/adapters",
      "src/services",
      "drizzle",
      "src/features/auth/actions",
      "src/app/[locale]/(marketing)/demo",
      "src/app/[locale]/(dashboard)/dashboard/credits/buy/buy-credits-view.tsx",
    ]) {
      expect(await exists(join(targetDirectory, path)), path).toBe(false);
    }
    const packageJson = JSON.parse(
      await readFile(join(targetDirectory, "package.json"), "utf8")
    ) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };
    for (const name of [
      "better-auth",
      "next-safe-action",
      "drizzle-orm",
      "pg",
      "@neondatabase/serverless",
      "@sentry/nextjs",
    ]) {
      expect(packageJson.dependencies).not.toHaveProperty(name);
    }
    expect(
      Object.keys(packageJson.scripts).some((name) => name.startsWith("db:"))
    ).toBe(false);
    expect(
      await readFile(join(targetDirectory, ".env.example"), "utf8")
    ).not.toMatch(/^\s*[A-Z_][A-Z0-9_]*\s*=/mu);
    expect(
      await exists(
        join(
          targetDirectory,
          "src/app/[locale]/(dashboard)/dashboard/support/[id]/page.tsx"
        )
      )
    ).toBe(true);
    expect(
      await readFile(
        join(targetDirectory, "src/modules/demo-skin-views.ts"),
        "utf8"
      )
    ).not.toContain("@/modules/skin-views");
  });
});

describe("皮肤演示数据预检", () => {
  it("演示头像保留来源许可和摘要，未使用素材仍被裁剪", async () => {
    const avatarPath = "assets/demo-avatar.svg";
    const unusedPath = "assets/unused-avatar.svg";
    const skin = await skinWithData(
      JSON.stringify({
        schemaVersion: 1,
        workspace: { user: { image: avatarPath } },
      })
    );
    const content = await readFile(
      resolve("tests/fixtures/skins/contrast/assets/brand.svg")
    );
    const hash = createHash("sha256").update(content).digest("hex");
    await mkdir(join(skin.directory, "assets"), { recursive: true });
    await writeFile(join(skin.directory, avatarPath), content);
    await writeFile(join(skin.directory, unusedPath), content);
    const manifest = await readSkinManifest(skin.directory);
    await writeFile(
      join(skin.directory, "skin.json"),
      JSON.stringify({
        ...manifest,
        assets: [
          ...manifest.assets,
          {
            id: "demo-avatar",
            kind: "file",
            author: "Fixture contributor",
            source: "https://example.test/avatar.svg",
            license: "MIT",
            purpose: "visual",
            files: [avatarPath, unusedPath],
          },
        ],
        files: { ...manifest.files, [avatarPath]: hash, [unusedPath]: hash },
      })
    );
    await refreshSkinFileHashes(skin.directory);
    const targetDirectory = join(root, "demo-avatar-license");
    await generateProject({
      targetDirectory,
      mode: "demo",
      skin,
      install: false,
    });
    const output = await readSkinManifest(join(targetDirectory, "src/skin"));
    expect(output.files[avatarPath]).toBe(hash);
    expect(
      output.assets.find((asset) => asset.id === "demo-avatar")
    ).toMatchObject({
      author: "Fixture contributor",
      source: "https://example.test/avatar.svg",
      license: "MIT",
      files: [avatarPath],
    });
    expect(
      await readFile(join(targetDirectory, "public/skin-assets", avatarPath))
    ).toEqual(content);
    expect(await exists(join(targetDirectory, "src/skin", unusedPath))).toBe(
      false
    );
    expect(
      await exists(join(targetDirectory, "public/skin-assets", unusedPath))
    ).toBe(false);
  });

  it.each([
    "full",
    "demo",
  ] as const)("%s 皮肤代码不能直接导入演示JSON", async (mode) => {
    const skin = await skinWithData('{"schemaVersion":1}');
    const file = join(skin.directory, "views/shared/empty-dashboard.tsx");
    await writeFile(
      file,
      `import demo from "../../demo/data.json";\nexport const importedDemo = demo;\n${await readFile(file, "utf8")}`
    );
    await refreshSkinFileHashes(skin.directory);
    const targetDirectory = join(root, `imported-demo-${mode}`);
    await expect(
      generateProject({
        targetDirectory,
        mode,
        skin,
        install: false,
        ...(mode === "full" ? { preset: "minimal" as const } : {}),
      })
    ).rejects.toThrow();
    expect(await exists(targetDirectory)).toBe(false);
  });

  it("异步动态视图在创建输出目录前被拒绝", async () => {
    const skin = await skinWithData('{"schemaVersion":1}');
    const file = join(skin.directory, "views/shared/empty-dashboard.tsx");
    const source = await readFile(file, "utf8");
    await writeFile(
      file,
      source.replace(
        /export (?:async )?function EmptyDashboardView/u,
        "export async function EmptyDashboardView"
      )
    );
    await refreshSkinFileHashes(skin.directory);
    const targetDirectory = join(root, "async-dynamic-view");
    await expect(
      generateProject({ targetDirectory, mode: "demo", skin, install: false })
    ).rejects.toThrow();
    expect(await exists(targetDirectory)).toBe(false);
  });

  it.each([
    {
      name: "async-child-in-render-loop",
      source: `import type { EmptyDashboardViewProps } from "@/features/shared/view";
async function AsyncChild() { return <div>Async child</div>; }
export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  return <div>{[1].map((value) => <AsyncChild key={value} />)}</div>;
}
`,
    },
    {
      name: "inferred-promise-view",
      source: `import type { EmptyDashboardViewProps } from "@/features/shared/view";
export const EmptyDashboardView = (_props: EmptyDashboardViewProps) =>
  Promise.resolve(<div>Async result</div>);
`,
    },
  ])("异步渲染边界不能绕过预检 $name", async ({ name, source }) => {
    const skin = await skinWithData('{"schemaVersion":1}');
    await writeFile(
      join(skin.directory, "views/shared/empty-dashboard.tsx"),
      source
    );
    await refreshSkinFileHashes(skin.directory);
    const targetDirectory = join(root, name);
    await expect(
      generateProject({ targetDirectory, mode: "demo", skin, install: false })
    ).rejects.toThrow();
    expect(await exists(targetDirectory)).toBe(false);
  });

  it("动态模块中的异步事件回调仍可使用", async () => {
    const skin = await skinWithData('{"schemaVersion":1}');
    const file = join(skin.directory, "views/shared/empty-dashboard.tsx");
    await writeFile(
      file,
      `${await readFile(file, "utf8")}\nexport const onDemoClick = async () => { return undefined; };\n`
    );
    await refreshSkinFileHashes(skin.directory);
    const result = await generateProject({
      targetDirectory: join(root, "async-event-callback"),
      mode: "demo",
      skin,
      install: false,
    });
    expect(result.manifest.mode).toBe("demo");
  });

  it("预检重新核对演示JSON，校验后的源文件变化不能悄悄生效", async () => {
    const skin = await skinWithData('{"schemaVersion":1}');
    const manifest = await readSkinManifest(skin.directory);
    await writeFile(
      join(skin.directory, "demo/data.json"),
      '{"schemaVersion":1,"workspace":{"user":{"name":"Changed"}}}'
    );
    await expect(
      prepareDemoData({
        directory: skin.directory,
        templateDirectory: resolve("."),
        manifest,
        packageHash: "a".repeat(64),
      })
    ).rejects.toThrow();
  });

  it("演示版按覆盖后的规范数据记录摘要", async () => {
    const patch = {
      schemaVersion: 1,
      workspace: { user: { name: "Taylor" } },
      support: { tickets: [] },
    };
    const skin = await skinWithData(JSON.stringify(patch));
    const expected = mergeDemoData(
      DEFAULT_DEMO_DATA,
      parseDemoDataPatch(patch)
    );
    const { manifest } = await generateProject({
      targetDirectory: join(root, "patched-demo"),
      mode: "demo",
      skin,
      install: false,
    });
    expect(manifest.demo?.dataSha256).toBe(
      createHash("sha256").update(serializeDemoData(expected)).digest("hex")
    );
  });

  it.each([
    '{"schemaVersion":1,"schemaVersion":1}',
    '{"schemaVersion":1,"pricing":{"pro":1}}',
    '{"schemaVersion":1,"workspace":{"credits":{"balance":1}}}',
    "{".repeat(262145),
  ])("无效或超长JSON在创建目标前被拒绝", async (source) => {
    const skin = await skinWithData(source);
    const targetDirectory = join(root, `bad-data-${fixtureId++}`);
    await expect(
      generateProject({ targetDirectory, mode: "demo", skin, install: false })
    ).rejects.toThrow();
    expect(await exists(targetDirectory)).toBe(false);
  });

  it("完整模式仅核验文件摘要，不解析演示JSON，也不输出它", async () => {
    const skin = await skinWithData("this is deliberately not JSON");
    const targetDirectory = join(root, "full-does-not-parse");
    const result = await generateProject({
      targetDirectory,
      mode: "full",
      preset: "minimal",
      skin,
      install: false,
    });
    expect(result.manifest.mode).toBe("full");
    expect(result.manifest.demo).toBeUndefined();
    expect(await exists(join(targetDirectory, "src/skin/demo"))).toBe(false);
    await writeFile(
      join(skin.directory, "demo/data.json"),
      "changed after hashing"
    );
    const badTarget = join(root, "full-integrity-failure");
    await expect(
      generateProject({
        targetDirectory: badTarget,
        mode: "full",
        preset: "minimal",
        skin,
        install: false,
      })
    ).rejects.toThrow();
    expect(await exists(badTarget)).toBe(false);
  });

  it("运行时也拒绝未定义的模式", async () => {
    const options = {
      targetDirectory: join(root, "unknown-mode"),
      mode: "other",
      install: false,
    } as unknown as GeneratorOptions;
    await expect(generateProject(options)).rejects.toThrow();
    expect(await exists(options.targetDirectory)).toBe(false);
  });
});
