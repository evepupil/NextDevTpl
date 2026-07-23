import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");
const sdkImportPattern =
  /(?:from\s+|import\s*\()\s*["'](?:@aws-sdk\/|@upstash\/|inngest["'/]|nodemailer["'/]|openai["'/]|resend["'/])/;
const adapterImportPattern =
  /(?:from\s+|import\s*\()\s*["']@\/adapters(?:\/[^"']*)?["']/;

function collectProductionSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return entry === "test" ? [] : collectProductionSources(path);
    }
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

function sourcePath(path: string): string {
  return relative(process.cwd(), path).split(sep).join("/");
}

describe("service adapter source boundaries", () => {
  it("keeps provider SDK imports inside adapters", () => {
    const violations = collectProductionSources(sourceRoot)
      .filter((path) => !sourcePath(path).startsWith("src/adapters/"))
      .filter((path) => sdkImportPattern.test(readFileSync(path, "utf8")))
      .map(sourcePath);

    expect(violations).toEqual([]);
  });

  it("limits provider implementation imports to composition entry points", () => {
    const allowed = new Set(["src/app/api/inngest/route.ts"]);
    const violations = collectProductionSources(sourceRoot)
      .filter((path) => {
        const relativePath = sourcePath(path);
        return (
          !relativePath.startsWith("src/adapters/") &&
          !relativePath.startsWith("src/services/") &&
          !allowed.has(relativePath)
        );
      })
      .filter((path) => adapterImportPattern.test(readFileSync(path, "utf8")))
      .map(sourcePath);

    expect(violations).toEqual([]);
  });
});
