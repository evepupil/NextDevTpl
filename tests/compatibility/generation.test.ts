import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateProject } from "../../packages/create-nextdevtpl/src/generate";
import { loadCompatibilityMatrix } from "./matrix";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("generated compatibility cases", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "nextdevtpl-compatibility-test-"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  for (const matrixCase of loadCompatibilityMatrix()) {
    it(`keeps ${matrixCase.id} isolated`, async () => {
      const target = join(root, matrixCase.id);
      const { manifest } = await generateProject({
        targetDirectory: target,
        preset: matrixCase.preset,
        target: matrixCase.target,
        install: false,
      });

      expect(manifest.preset).toBe(matrixCase.preset);
      expect(manifest.target).toBe(matrixCase.target);
      for (const path of matrixCase.requiredPaths) {
        expect(await exists(join(target, path)), `${path} should exist`).toBe(
          true
        );
      }
      for (const path of matrixCase.forbiddenPaths) {
        expect(
          await exists(join(target, path)),
          `${path} should be absent`
        ).toBe(false);
      }
    });
  }

  it("supports module removal and adapter replacement selections", async () => {
    const target = join(root, "lifecycle-selection");
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

    expect(manifest.adapters.mail).toBe("mail:smtp");
    expect(manifest.modules).not.toContain("payment");
    expect(await exists(join(target, "src/features/payment"))).toBe(false);
    expect(await exists(join(target, "src/adapters/mail/resend.ts"))).toBe(
      false
    );
  });
});
