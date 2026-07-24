import {
  access,
  mkdir,
  mkdtemp,
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
    ) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    const lockfile = await readFile(join(target, "pnpm-lock.yaml"), "utf8");

    expect(manifest.modules).toEqual(["mail", "shared", "auth", "dashboard"]);
    expect(await exists(join(target, "src/features/credits"))).toBe(false);
    expect(await exists(join(target, "src/app/api/inngest"))).toBe(false);
    expect(await exists(join(target, "src/lib/ai"))).toBe(false);
    expect(
      await exists(join(target, "src/app/[locale]/opengraph-image.tsx"))
    ).toBe(false);
    expect(
      await exists(join(target, "src/app/[locale]/twitter-image.tsx"))
    ).toBe(false);
    expect(packageJson.dependencies).not.toHaveProperty("resend");
    expect(packageJson.dependencies).not.toHaveProperty("openai");
    expect(packageJson.dependencies).not.toHaveProperty("inngest");
    expect(packageJson.dependencies).not.toHaveProperty("@upstash/ratelimit");
    expect(packageJson.dependencies).not.toHaveProperty("@aws-sdk/client-s3");
    expect(packageJson.devDependencies).not.toHaveProperty(
      "@opennextjs/cloudflare"
    );
    expect(packageJson.devDependencies).not.toHaveProperty("wrangler");
    expect(packageJson.scripts).not.toHaveProperty("postinstall");
    expect(lockfile).not.toContain("specifier: ^6.8.0");
    expect(lockfile).not.toContain("specifier: 4.113.0");
    expect(await exists(join(target, "deploy/server/build.sh"))).toBe(true);
    expect(await exists(join(target, "Dockerfile"))).toBe(false);
    expect(await exists(join(target, "vercel.json"))).toBe(false);
    expect(await exists(join(target, "wrangler.jsonc"))).toBe(false);
    expect(await exists(join(target, "open-next.config.ts"))).toBe(false);
    expect(await exists(join(target, "cloudflare"))).toBe(false);
    expect(await exists(join(target, "next-env.d.ts"))).toBe(false);
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
    ) as {
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };

    expect(packageJson.dependencies).toHaveProperty("resend");
    expect(packageJson.dependencies).toHaveProperty("inngest");
    expect(packageJson.dependencies).not.toHaveProperty("openai");
    expect(packageJson.scripts.postinstall).toBe("fumadocs-mdx");
    expect(await exists(join(target, "src/features/analytics"))).toBe(false);
    expect(await exists(join(target, "src/features/blog"))).toBe(false);
    expect(await exists(join(target, "vercel.json"))).toBe(true);
    expect(await exists(join(target, "Dockerfile"))).toBe(false);
  });

  it("records Cloudflare bindings for the AI SaaS preset", async () => {
    const target = join(root, "ai-saas");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "ai-saas",
      install: false,
    });
    const packageJson = JSON.parse(
      await readFile(join(target, "package.json"), "utf8")
    ) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    const wrangler = JSON.parse(
      await readFile(join(target, "wrangler.jsonc"), "utf8")
    ) as {
      ai: { binding: string };
      main: string;
      minify: boolean;
      observability: { enabled: boolean };
      r2_buckets: Array<{ binding: string }>;
      ratelimits: Array<{
        name: string;
        simple: { limit: number; period: number };
      }>;
      send_email: Array<{ name: string }>;
      workflows: Array<{ binding: string; class_name: string }>;
    };
    const database = await readFile(join(target, "src/db/index.ts"), "utf8");
    const storage = await readFile(
      join(target, "src/services/storage.ts"),
      "utf8"
    );
    const ai = await readFile(join(target, "src/services/ai.ts"), "utf8");
    const mail = await readFile(join(target, "src/services/mail.ts"), "utf8");
    const jobs = await readFile(join(target, "src/services/jobs.ts"), "utf8");
    const rateLimit = await readFile(
      join(target, "src/services/rate-limit.ts"),
      "utf8"
    );
    const monitoring = await readFile(
      join(target, "src/lib/monitoring/index.ts"),
      "utf8"
    );
    const logger = await readFile(
      join(target, "src/lib/logger/index.ts"),
      "utf8"
    );
    const environment = await readFile(join(target, ".env.example"), "utf8");

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
    expect(await exists(join(target, "deploy"))).toBe(false);
    expect(await exists(join(target, "vercel.json"))).toBe(false);
    expect(await exists(join(target, "open-next.config.ts"))).toBe(true);
    expect(await exists(join(target, "cloudflare/worker.mjs"))).toBe(true);
    expect(wrangler.main).toBe("cloudflare/worker.mjs");
    expect(wrangler.minify).toBe(true);
    expect(wrangler.observability.enabled).toBe(true);
    expect(wrangler.r2_buckets).toEqual([{ binding: "NEXTDEVTPL_STORAGE" }]);
    expect(wrangler.ai.binding).toBe("AI");
    expect(wrangler.workflows).toEqual([
      expect.objectContaining({
        binding: "NEXTDEVTPL_WORKFLOW",
        class_name: "NextDevTplWorkflow",
      }),
    ]);
    expect(wrangler.send_email).toEqual([{ name: "NEXTDEVTPL_EMAIL" }]);
    expect(wrangler.ratelimits).toHaveLength(6);
    expect(wrangler.ratelimits).toContainEqual({
      name: "RATE_LIMIT_AUTH",
      namespace_id: "1002",
      simple: { limit: 5, period: 60 },
    });
    expect(database).toContain('from "drizzle-orm/neon-http"');
    expect(database).not.toContain('from "drizzle-orm/node-postgres"');
    expect(database).not.toContain('require("ws")');
    expect(storage).toContain('"NEXTDEVTPL_STORAGE"');
    expect(ai).toContain('"AI"');
    expect(mail).toContain('"NEXTDEVTPL_EMAIL"');
    expect(jobs).toContain('"NEXTDEVTPL_WORKFLOW"');
    expect(rateLimit).toContain('"RATE_LIMIT_AUTH"');
    expect(storage).not.toContain("replaces this empty map");
    expect(ai).not.toContain("binding is not injected");
    expect(packageJson.devDependencies).toHaveProperty(
      "@opennextjs/cloudflare"
    );
    expect(packageJson.devDependencies).toHaveProperty("wrangler");
    expect(packageJson.devDependencies).not.toHaveProperty("@types/pg");
    expect(packageJson.devDependencies).not.toHaveProperty("@types/ws");
    expect(packageJson.dependencies).not.toHaveProperty("pg");
    expect(packageJson.dependencies).not.toHaveProperty("ws");
    expect(packageJson.dependencies).not.toHaveProperty("@sentry/nextjs");
    expect(packageJson.dependencies).not.toHaveProperty("pino");
    expect(packageJson.devDependencies).not.toHaveProperty("pino-pretty");
    expect(packageJson.dependencies).not.toHaveProperty(
      "@react-email/components"
    );
    expect(packageJson.dependencies).not.toHaveProperty("@react-email/render");
    expect(packageJson.dependencies).not.toHaveProperty(
      "@react-email/tailwind"
    );
    expect(packageJson.scripts["cf:deploy"]).toContain("--minify");
    expect(
      await exists(join(target, "src/app/[locale]/opengraph-image.tsx"))
    ).toBe(false);
    expect(
      await exists(join(target, "src/app/[locale]/twitter-image.tsx"))
    ).toBe(false);
    expect(await exists(join(target, "cloudflare/templates"))).toBe(false);
    const auth = await readFile(join(target, "src/lib/auth/index.ts"), "utf8");
    const mailServer = await readFile(
      join(target, "src/features/mail/server.ts"),
      "utf8"
    );
    expect(auth).toContain("content: createResetPasswordEmail");
    expect(auth).toContain("content: createVerifyEmail");
    expect(mailServer).toContain("createResetPasswordEmail");
    expect(packageJson.scripts["cf:types"]).toBe("wrangler types");
    expect(monitoring).not.toContain("@sentry/nextjs");
    expect(monitoring).toContain("console.error");
    expect(logger).not.toContain('from "pino"');
    expect(logger).toContain("console[CONSOLE_METHODS[level]]");
    expect(await exists(join(target, "src/instrumentation.ts"))).toBe(false);
    expect(await exists(join(target, "sentry.server.config.ts"))).toBe(false);
    expect(environment).not.toContain("SENTRY_AUTH_TOKEN");
    expect(environment).not.toContain("NEXT_PUBLIC_SENTRY_DSN");
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

  it("generates a Cloudflare project without auth or mail modules", async () => {
    const target = join(root, "cloudflare-dashboard");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["dashboard"],
      target: "cloudflare",
      install: false,
    });

    expect(manifest.modules).toEqual(["shared", "dashboard"]);
    expect(await exists(join(target, "src/features/mail"))).toBe(false);
    expect(await exists(join(target, "wrangler.jsonc"))).toBe(true);
    expect(await exists(join(target, "cloudflare/templates"))).toBe(false);
  });

  it("keeps only the Docker deployment preset", async () => {
    const target = join(root, "docker");
    await generateProject({
      targetDirectory: target,
      preset: "saas",
      target: "docker",
      install: false,
    });
    const dockerfile = await readFile(join(target, "Dockerfile"), "utf8");
    const compose = await readFile(join(target, "compose.yaml"), "utf8");

    expect(await exists(join(target, "Dockerfile"))).toBe(true);
    expect(await exists(join(target, "compose.yaml"))).toBe(true);
    expect(await exists(join(target, "deploy/docker/README.md"))).toBe(true);
    expect(await exists(join(target, "deploy/server"))).toBe(false);
    expect(await exists(join(target, "deploy/vercel"))).toBe(false);
    expect(await exists(join(target, "vercel.json"))).toBe(false);
    expect(dockerfile).toContain(
      "pnpm install --frozen-lockfile --ignore-scripts"
    );
    expect(dockerfile).toContain("pnpm run --if-present postinstall");
    expect(compose).toContain("  PORT: 3000");
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
