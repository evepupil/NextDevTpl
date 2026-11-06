/**
 * 生成项目 package.json 的仓库专用裁剪规则。
 *
 * 仓库根目录的 package.json 会被直接复制进生成项目，其中包含仓库自用
 * 的截图工具。e2e 目录不进入生成项目，因此在 rewritePackage 阶段剥掉
 * 对应的脚本和开发依赖，避免生成项目引用不存在的文件或无用的工具。
 */

/** 仓库专用的截图基线依赖，生成项目不带 e2e 目录，也不需要它们。 */
const REPOSITORY_ONLY_DEV_DEPENDENCIES: readonly string[] = [
  "@playwright/test",
];

/** 生成项目里需要整体删除的仓库专用脚本名前缀。 */
const REPOSITORY_ONLY_SCRIPT_PREFIXES: readonly string[] = ["visual:"];

/**
 * 从 package.json 片段中删除仓库专用 devDependencies 与脚本。
 *
 * 规则按依赖名/脚本名前缀匹配，而不是逐个写死脚本名，这样仓库侧新增
 * `visual:xxx` 之类的脚本时生成项目也会自动剔除。
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
        REPOSITORY_ONLY_SCRIPT_PREFIXES.some((prefix) =>
          name.startsWith(prefix)
        )
      ) {
        delete packageJson.scripts[name];
      }
    }
  }
  return packageJson;
}
