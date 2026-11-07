import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadCatalog } from "../../../packages/create-nextdevtpl/src/catalog";
import { validateDemoClientViews } from "../../../packages/create-nextdevtpl/src/demo-client-validation";
import {
  readSkinManifest,
  refreshSkinFileHashes,
} from "../../../packages/create-nextdevtpl/src/skins";
import type { ValidatedSkin } from "../../../packages/create-nextdevtpl/src/skins/types";
import type { RecipeCatalog } from "../../../packages/create-nextdevtpl/src/types";

let root: string;
let catalog: RecipeCatalog;
let fixture = 0;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "nextdevtpl-demo-client-"));
  catalog = await loadCatalog(resolve("recipes/catalog.json"));
});
afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

async function createSkin(source?: string): Promise<ValidatedSkin> {
  const directory = join(root, `skin-${fixture++}`);
  await cp(resolve("src/skin"), directory, { recursive: true });
  if (source)
    await writeFile(
      join(directory, "views/shared/empty-dashboard.tsx"),
      source
    );
  await refreshSkinFileHashes(directory);
  return {
    directory,
    templateDirectory: resolve("."),
    manifest: await readSkinManifest(directory),
    packageHash: "0".repeat(64),
  };
}

const viewTypes =
  'import type { EmptyDashboardViewProps } from "@/features/shared/view";\n';

describe("演示动态视图的客户端兼容检查", () => {
  it("默认动态视图合法，静态博客和法律页仍可异步", async () => {
    const skin = await createSkin();
    await expect(
      validateDemoClientViews(skin, catalog)
    ).resolves.toBeUndefined();
  });

  it.each([
    `export async function EmptyDashboardView(_props: EmptyDashboardViewProps) { return <div>Async root</div>; }`,
    `export const EmptyDashboardView = (_props: EmptyDashboardViewProps) => Promise.resolve(<div>Async root</div>);`,
    `async function AsyncChild() { return <div>Async child</div>; }
export function EmptyDashboardView(_props: EmptyDashboardViewProps) { return <div>{[1].map((value) => <AsyncChild key={value} />)}</div>; }`,
  ])("拒绝异步视图和渲染循环中的异步子组件", async (source) => {
    const skin = await createSkin(`${viewTypes}${source}`);
    await expect(validateDemoClientViews(skin, catalog)).rejects.toThrow();
  });

  it("允许内联和具名异步事件回调", async () => {
    const skin = await createSkin(`${viewTypes}
const onClick = async () => { return undefined; };
export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  return <div><button type="button" onClick={onClick}>Save</button><button type="button" onClick={async () => { return undefined; }}>Continue</button></div>;
}`);
    await expect(
      validateDemoClientViews(skin, catalog)
    ).resolves.toBeUndefined();
  });

  it.each([
    ['import { createElement } from "react";', "createElement(AsyncChild)"],
    [
      'import { createElement as renderElement } from "react";',
      "renderElement(AsyncChild)",
    ],
    ['import * as React from "react";', "React.createElement(AsyncChild)"],
    ['import * as React from "react";', 'React["createElement"](AsyncChild)'],
    [
      'import React from "react";',
      'React.createElement("section", null, React.createElement(AsyncChild))',
    ],
  ])("拒绝组件创建调用中的异步子组件：%s", async (imports, expression) => {
    const skin = await createSkin(`${viewTypes}
${imports}
async function AsyncChild() { return <div>Async child</div>; }
export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  return ${expression};
}`);
    await expect(validateDemoClientViews(skin, catalog)).rejects.toThrow(
      "must be synchronous"
    );
  });

  it("普通同名函数与事件中的组件创建调用不误判为渲染", async () => {
    const skin = await createSkin(`${viewTypes}
import { createElement as renderElement } from "react";
async function AsyncChild() { return <div>Async child</div>; }
function createElement(_component: typeof AsyncChild) { return <div>Local call</div>; }
export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  const onClick = async () => { renderElement(AsyncChild); };
  return <button type="button" onClick={onClick}>{createElement(AsyncChild)}</button>;
}`);
    await expect(
      validateDemoClientViews(skin, catalog)
    ).resolves.toBeUndefined();
  });

  it("组件内部同名绑定遮蔽 React 导入时不误判", async () => {
    const skin = await createSkin(`${viewTypes}
import { createElement } from "react";
async function AsyncChild() { return <div>Async child</div>; }
export function EmptyDashboardView(_props: EmptyDashboardViewProps) {
  const createElement = (_component: typeof AsyncChild) => <div>Local call</div>;
  return createElement(AsyncChild);
}`);
    await expect(
      validateDemoClientViews(skin, catalog)
    ).resolves.toBeUndefined();
  });

  it("运行时服务端专用导入被拒绝", async () => {
    const skin = await createSkin(`${viewTypes}
import "server-only";
export function EmptyDashboardView(_props: EmptyDashboardViewProps) { return <div>Server import</div>; }`);
    await expect(validateDemoClientViews(skin, catalog)).rejects.toThrow();
  });

  it("纯类型服务端引用不作为运行时依赖", async () => {
    const skin = await createSkin(`${viewTypes}
import type { getTranslations } from "next-intl/server";
type ServerTranslationType = typeof getTranslations;
export type { ServerTranslationType };
export function EmptyDashboardView(_props: EmptyDashboardViewProps) { return <div>Type only</div>; }`);
    await expect(
      validateDemoClientViews(skin, catalog)
    ).resolves.toBeUndefined();
  });

  it("读取的视图必须仍匹配已校验的源文件摘要", async () => {
    const skin = await createSkin();
    const file = join(skin.directory, "views/shared/empty-dashboard.tsx");
    await writeFile(
      file,
      `${await readFile(file, "utf8")}\nexport const changed = true;\n`
    );
    await expect(validateDemoClientViews(skin, catalog)).rejects.toThrow(
      /hash/i
    );
  });
});
