/**
 * 生成项目 package.json 的仓库专用裁剪与命令替换规则。
 *
 * 仓库根目录的 package.json 会被直接复制进生成项目，其中包含仓库自用
 * 的截图工具和皮肤包校验器。相关脚本与开发依赖需从生成项目移除；仓库
 * lint 则只保留其中可独立运行的 Biome 检查。
 */

/** 仓库专用的截图基线依赖，生成项目不带 e2e 目录，也不需要它们。 */
const REPOSITORY_ONLY_DEV_DEPENDENCIES: readonly string[] = [
  "@playwright/test",
  "tar-stream",
];

/** 生成项目里需要整体删除的仓库专用脚本名前缀。 */
const REPOSITORY_ONLY_SCRIPT_PREFIXES: readonly string[] = [
  "palette:",
  "visual:",
];
const REPOSITORY_ONLY_SCRIPTS: readonly string[] = ["skin:check", "skin:hash"];
const REPOSITORY_SCRIPT_REWRITES: Readonly<
  Record<string, { from: string; to: string }>
> = {
  lint: {
    from: "pnpm skin:check && biome lint .",
    to: "biome lint .",
  },
};

/**
 * 从 package.json 片段中删除仓库专用 devDependencies 与脚本。
 *
 * 仅对仓库专用依赖、已知命令名和 `visual:` 命名前缀操作；lint 转换要求
 * 命令值精确匹配仓库链，避免改写用户自定义 lint 命令。
 *
 * @param packageJson 读取自仓库根目录、即将写入生成项目的 package.json
 * @returns 修改后的同一个对象（就地修改并返回，方便调用方继续调整）
 */
export function pruneRepositoryOnlyPackageEntries<
  T extends {
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  },
>(packageJson: T): T {
  if (packageJson.devDependencies) {
    for (const name of REPOSITORY_ONLY_DEV_DEPENDENCIES) {
      delete packageJson.devDependencies[name];
    }
  }
  if (packageJson.scripts) {
    for (const name of Object.keys(packageJson.scripts)) {
      if (
        REPOSITORY_ONLY_SCRIPTS.includes(name) ||
        REPOSITORY_ONLY_SCRIPT_PREFIXES.some((prefix) =>
          name.startsWith(prefix)
        )
      ) {
        delete packageJson.scripts[name];
        continue;
      }
      const rewrite = REPOSITORY_SCRIPT_REWRITES[name];
      if (rewrite && packageJson.scripts[name] === rewrite.from) {
        packageJson.scripts[name] = rewrite.to;
      }
    }
  }
  return packageJson;
}
