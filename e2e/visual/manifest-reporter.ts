/**
 * 基线清单生成器（Playwright 自定义 reporter）
 *
 * 只在“重拍基线”（--update-snapshots=all）且全部用例通过时工作：
 * 1. 按页面清单核对 4 个变体 × 2 种语言的基线图片是否齐全；
 * 2. 删掉不属于当前清单的旧图（比如以后下线的页面）；
 * 3. 写出 baseline-manifest.json：拍摄时间、提交、浏览器和 Playwright 版本、固定时刻，
 *    以及每张图的宽、高和 SHA-256。
 *
 * 图片本身在 artifacts/ 下被 .gitignore 忽略，清单随代码入库：
 * 别人拿到清单，就能核对自己重拍出来的图和基线是不是同一批像素。
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

import { VISUAL_LOCALES, VISUAL_NOW } from "./constants";
import { getExpectedVisualTestIds, isCompleteVisualRun } from "./coverage";
import { VISUAL_TARGETS } from "./pages";
import { BASELINE_DIR, MANIFEST_FILE, REPO_ROOT } from "./paths";
import { readRunInfo } from "./run-state";

interface ManifestImage {
  height: number;
  sha256: string;
  width: number;
}

interface BaselineManifest {
  capturedAt: string;
  commit: string;
  edgeVersion: string;
  images: Record<string, ManifestImage>;
  playwrightVersion: string;
  visualNow: string;
  workingTreeDirty: boolean;
}

/** 读取 PNG 头部的宽高：签名 8 字节之后是 IHDR 块，宽高各占 4 字节（大端） */
function readPngSize(buffer: Buffer): { height: number; width: number } {
  if (buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("不是有效的 PNG 文件");
  }
  return { height: buffer.readUInt32BE(20), width: buffer.readUInt32BE(16) };
}

function runGit(args: string[]): string {
  const result = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

/** 当前清单应该包含的全部图片（相对基线目录的路径） */
function expectedImages(projectNames: readonly string[]): string[] {
  const names: string[] = [];
  for (const project of projectNames) {
    for (const locale of VISUAL_LOCALES) {
      for (const target of VISUAL_TARGETS) {
        if (target.kind === "screenshot") {
          names.push(`${project}/${locale}-${target.id}.png`);
        }
      }
    }
  }
  return names.sort();
}

/** 列出基线目录下现有的全部 PNG（相对路径，正斜杠） */
function listBaselineImages(): string[] {
  if (!fs.existsSync(BASELINE_DIR)) return [];
  const files: string[] = [];
  for (const project of fs.readdirSync(BASELINE_DIR)) {
    const projectDir = path.join(BASELINE_DIR, project);
    if (!fs.statSync(projectDir).isDirectory()) continue;
    for (const file of fs.readdirSync(projectDir)) {
      if (file.endsWith(".png")) files.push(`${project}/${file}`);
    }
  }
  return files.sort();
}

function coverageSummary(
  label: string,
  ids: readonly string[],
  expectedIds: readonly string[]
): string {
  const actualSet = new Set(ids);
  const expectedSet = new Set(expectedIds);
  const missing = expectedIds.filter((id) => !actualSet.has(id)).length;
  const extra = ids.filter((id) => !expectedSet.has(id)).length;
  const duplicates = ids.length - actualSet.size;
  return (
    `${label} ${ids.length}/${expectedIds.length}（缺少 ${missing}、` +
    `多出 ${extra}、重复 ${duplicates}）`
  );
}

export default class ManifestReporter implements Reporter {
  private config: FullConfig | undefined;
  private selectedTestIds: string[] = [];
  private passedTestIds: string[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.selectedTestIds = suite.allTests().map((test) => {
      const projectName = test.parent.project()?.name ?? "unknown";
      return `${projectName}:${test.title}`;
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== "passed") return;
    const projectName = test.parent.project()?.name ?? "unknown";
    this.passedTestIds.push(`${projectName}:${test.title}`);
  }

  onEnd(result: FullResult): void {
    const config = this.config;
    if (!config || config.updateSnapshots !== "all") return;

    if (result.status !== "passed") {
      console.log("[visual] 有用例失败，不生成基线清单");
      return;
    }

    const expectedTestIds = getExpectedVisualTestIds();
    if (!isCompleteVisualRun(this.selectedTestIds, this.passedTestIds)) {
      console.log(
        `[visual] 用例覆盖不完整，不写入清单也不清理基线；` +
          `${coverageSummary("选中", this.selectedTestIds, expectedTestIds)}；` +
          `${coverageSummary("通过", this.passedTestIds, expectedTestIds)}`
      );
      return;
    }

    const projectNames = config.projects.map((project) => project.name);
    const expected = expectedImages(projectNames);
    const existing = new Set(listBaselineImages());
    const missing = expected.filter((name) => !existing.has(name));
    if (missing.length > 0) {
      console.log(
        `[visual] 基线图片不齐全（缺 ${missing.length} 张，可能只跑了部分项目），不生成清单`
      );
      return;
    }

    // 清掉不在当前清单里的旧图，保证基线目录和清单一一对应
    const expectedSet = new Set(expected);
    for (const name of existing) {
      if (!expectedSet.has(name)) {
        fs.rmSync(path.join(BASELINE_DIR, name), { force: true });
        console.log(`[visual] 已删除过期基线 ${name}`);
      }
    }

    const images: Record<string, ManifestImage> = {};
    let totalBytes = 0;
    for (const name of expected) {
      const buffer = fs.readFileSync(path.join(BASELINE_DIR, name));
      totalBytes += buffer.length;
      images[name] = {
        ...readPngSize(buffer),
        sha256: createHash("sha256").update(buffer).digest("hex"),
      };
    }

    const manifest: BaselineManifest = {
      capturedAt: new Date().toISOString(),
      commit: runGit(["rev-parse", "HEAD"]),
      edgeVersion: readRunInfo()?.edgeVersion ?? "unknown",
      images,
      playwrightVersion: config.version,
      visualNow: VISUAL_NOW,
      workingTreeDirty: runGit(["status", "--porcelain"]).length > 0,
    };
    fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `[visual] 已生成基线清单（${expected.length} 张图，共 ${(totalBytes / 1024 / 1024).toFixed(1)} MB）：${MANIFEST_FILE}`
    );
  }
}
