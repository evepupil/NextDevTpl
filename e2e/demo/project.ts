import fs from "node:fs";
import path from "node:path";

import { resolveSkinAcceptanceProject } from "../skin/project";
import { REPO_ROOT } from "../visual/paths";

export function demoProject() {
  const directory = process.env.NEXTDEVTPL_DEMO_PROJECT_DIR;
  const receipt = process.env.NEXTDEVTPL_DEMO_PROJECT_RECEIPT;
  if (!directory || !receipt) {
    throw new Error("请指定本轮演示项目目录和已通过的生成回执。");
  }
  const selected = resolveSkinAcceptanceProject({
    directory,
    receipt,
    repositoryRoot: REPO_ROOT,
  });
  const generated: unknown = JSON.parse(
    fs.readFileSync(
      path.join(selected.directory, "nextdevtpl.generated.json"),
      "utf8"
    )
  );
  if (
    typeof generated !== "object" ||
    generated === null ||
    !("mode" in generated) ||
    generated.mode !== "demo" ||
    !("viewModules" in generated) ||
    !Array.isArray(generated.viewModules) ||
    generated.viewModules.length !== 8 ||
    selected.modules.length !== 0
  ) {
    throw new Error("浏览器验收要求独立的纯前端生成项目。");
  }
  return selected;
}
