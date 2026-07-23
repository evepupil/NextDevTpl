import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateProject } from "../../../packages/create-nextdevtpl/src/generate";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("project generation", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "nextdevtpl-generator-"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("generates a physically minimal project", async () => {
    const target = join(root, "minimal");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "minimal",
      install: false,
    });
    const packageJson = JSON.parse(
      await readFile(join(target, "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };

    expect(manifest.modules).toEqual(["mail", "shared", "auth", "dashboard"]);
    expect(await exists(join(target, "src/features/credits"))).toBe(false);
    expect(await exists(join(target, "src/app/api/inngest"))).toBe(false);
    expect(await exists(join(target, "src/lib/ai"))).toBe(false);
    expect(packageJson.dependencies).not.toHaveProperty("resend");
    expect(packageJson.dependencies).not.toHaveProperty("openai");
    expect(packageJson.dependencies).not.toHaveProperty("inngest");
    expect(packageJson.dependencies).not.toHaveProperty("@upstash/ratelimit");
    expect(packageJson.dependencies).not.toHaveProperty("@aws-sdk/client-s3");
  });

  it("keeps only SaaS preset adapters", async () => {
    const target = join(root, "saas");
    await generateProject({
      targetDirectory: target,
      preset: "saas",
      install: false,
    });
    const packageJson = JSON.parse(
      await readFile(join(target, "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies).toHaveProperty("resend");
    expect(packageJson.dependencies).toHaveProperty("inngest");
    expect(packageJson.dependencies).not.toHaveProperty("openai");
    expect(await exists(join(target, "src/features/analytics"))).toBe(false);
    expect(await exists(join(target, "src/features/blog"))).toBe(false);
  });

  it("records Cloudflare bindings for the AI SaaS preset", async () => {
    const target = join(root, "ai-saas");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "ai-saas",
      install: false,
    });

    expect(manifest.bindings).toEqual([
      "R2Bucket",
      "SendEmail",
      "Ai",
      "Workflow",
      "RateLimit",
    ]);
    expect(
      await exists(join(target, "src/adapters/ai/openai-compatible.ts"))
    ).toBe(false);
    expect(await exists(join(target, "src/adapters/ai/workers-ai.ts"))).toBe(
      true
    );
  });

  it("generates a stable custom module and adapter selection", async () => {
    const target = join(root, "custom");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["auth", "dashboard", "storage"],
      target: "server",
      adapterOverrides: {
        mail: "mail:smtp",
        storage: "storage:s3-compatible",
        "rate-limit": "rate-limit:noop",
      },
      install: false,
    });

    expect(manifest.adapters).toEqual({
      mail: "mail:smtp",
      storage: "storage:s3-compatible",
      "rate-limit": "rate-limit:noop",
    });
    expect(await exists(join(target, "src/features/storage"))).toBe(true);
    expect(await exists(join(target, "src/features/payment"))).toBe(false);
    expect(await exists(join(target, "src/adapters/mail/resend.ts"))).toBe(
      false
    );
  });

  it("rejects a non-empty target without changing it", async () => {
    const target = join(root, "occupied");
    await mkdir(target);
    await writeFile(join(target, "keep.txt"), "keep", "utf8");

    await expect(
      generateProject({ targetDirectory: target, install: false })
    ).rejects.toThrow("must be empty");
    await expect(readFile(join(target, "keep.txt"), "utf8")).resolves.toBe(
      "keep"
    );
  });

  it("rolls back only a target created by the failed run", async () => {
    const target = join(root, "rollback");

    await expect(
      generateProject({
        targetDirectory: target,
        templateManifestPath: join(root, "missing-manifest.json"),
        install: false,
      })
    ).rejects.toThrow();
    expect(await exists(target)).toBe(false);
  });
});
