import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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
        ...(matrixCase.mode ? { mode: matrixCase.mode } : {}),
        ...(matrixCase.preset ? { preset: matrixCase.preset } : {}),
        ...(matrixCase.modules ? { modules: matrixCase.modules } : {}),
        ...(matrixCase.adapterOverrides
          ? { adapterOverrides: matrixCase.adapterOverrides }
          : {}),
        ...(matrixCase.skin
          ? {
              skin:
                matrixCase.skin.kind === "local"
                  ? {
                      ...matrixCase.skin,
                      directory: resolve(
                        process.cwd(),
                        matrixCase.skin.directory
                      ),
                    }
                  : matrixCase.skin,
            }
          : {}),
        ...(matrixCase.palette ? { palette: matrixCase.palette } : {}),
        target: matrixCase.target,
        install: false,
      });

      expect(manifest.preset).toBe(
        matrixCase.expectedPreset ?? matrixCase.preset
      );
      expect(manifest.mode).toBe(matrixCase.mode ?? "full");
      expect(manifest.target).toBe(matrixCase.target);
      expect(manifest.skin.source.kind).toBe(
        matrixCase.skin?.kind ?? "builtin"
      );
      expect(manifest.skin.id).toBe(
        matrixCase.expectedSkinId ??
          (matrixCase.skin?.kind === "builtin" ? matrixCase.skin.id : "default")
      );
      expect(manifest.skin.palette?.id).toBe(matrixCase.palette);
      if (matrixCase.mode === "demo") {
        expect(manifest.modules).toEqual([]);
        expect(manifest.adapters).toEqual({});
        expect(manifest.bindings).toEqual([]);
        expect(manifest.viewModules).toHaveLength(8);
        expect(manifest.demo?.dataSha256).toMatch(/^[a-f0-9]{64}$/u);
      }
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
