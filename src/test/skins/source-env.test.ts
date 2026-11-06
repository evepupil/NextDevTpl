import { describe, expect, it } from "vitest";
import { GeneratorError } from "../../../packages/create-nextdevtpl/src/generator-error";
import {
  sanitizeSkinError,
  skinProcessEnvironment,
} from "../../../packages/create-nextdevtpl/src/skins/source-env";
import type { SkinSourceSelection } from "../../../packages/create-nextdevtpl/src/skins/source-types";

describe("skin download credential boundaries", () => {
  const selection: SkinSourceSelection = {
    kind: "remote",
    url: "https://skins.example.test/source.tgz",
    sha256: "a".repeat(64),
    tokenEnv: "PRIVATE_SKIN_TOKEN",
  };

  it("removes both credential names without changing the caller environment", () => {
    const environment = {
      NODE_ENV: "test" as const,
      PATH: "test-path",
      DATABASE_URL: "test-database",
      NEXTDEVTPL_SKIN_TOKEN: "default-test-token",
      PRIVATE_SKIN_TOKEN: "private-test-token",
    };
    const sanitized = skinProcessEnvironment(selection, environment);

    expect(sanitized).toEqual({
      NODE_ENV: "test",
      PATH: "test-path",
      DATABASE_URL: "test-database",
    });
    expect(environment.PRIVATE_SKIN_TOKEN).toBe("private-test-token");
    expect(environment.NEXTDEVTPL_SKIN_TOKEN).toBe("default-test-token");
  });

  it("also removes the default credential for built-in or local generation", () => {
    expect(
      skinProcessEnvironment(undefined, {
        NODE_ENV: "test",
        NEXTDEVTPL_SKIN_TOKEN: "default-test-token",
        APP_VERSION: "test",
      })
    ).toEqual({ NODE_ENV: "test", APP_VERSION: "test" });
  });

  it.skipIf(process.platform !== "win32")(
    "matches credential names without regard to Windows casing",
    () => {
      expect(
        skinProcessEnvironment(selection, {
          NODE_ENV: "test",
          NextDevTpl_Skin_Token: "default-test-token",
          Private_Skin_Token: "private-test-token",
          APP_VERSION: "test",
        })
      ).toEqual({ NODE_ENV: "test", APP_VERSION: "test" });
    }
  );

  it("removes known credential values from the final displayed error", () => {
    const error = sanitizeSkinError(
      new Error("failed: default-test-token / private-test-token"),
      selection,
      {
        NODE_ENV: "test",
        NEXTDEVTPL_SKIN_TOKEN: "default-test-token",
        PRIVATE_SKIN_TOKEN: "private-test-token",
      }
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).not.toContain("default-test-token");
    expect(error.message).not.toContain("private-test-token");
    expect(error.stack).not.toContain("private-test-token");
  });

  it("preserves trusted generator diagnostics while redacting credentials", () => {
    const error = sanitizeSkinError(
      new GeneratorError(
        "CF_COMPATIBILITY_DATE is invalid: private-test-token"
      ),
      selection,
      {
        NODE_ENV: "test",
        NEXTDEVTPL_SKIN_TOKEN: "default-test-token",
        PRIVATE_SKIN_TOKEN: "private-test-token",
      }
    );

    expect(error.message).toContain("CF_COMPATIBILITY_DATE is invalid");
    expect(error.message).not.toContain("private-test-token");
  });

  it("replaces untrusted system errors with a generic message", () => {
    const error = sanitizeSkinError(
      new Error("internal path and private-test-token"),
      selection,
      {
        NODE_ENV: "test",
        NEXTDEVTPL_SKIN_TOKEN: "default-test-token",
        PRIVATE_SKIN_TOKEN: "private-test-token",
      }
    );

    expect(error.message).toBe("Skin source operation failed");
    expect(error.message).not.toContain("internal path");
    expect(error.message).not.toContain("private-test-token");
  });
});
