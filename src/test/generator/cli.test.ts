import { describe, expect, it } from "vitest";

import { parseCliArguments } from "../../../packages/create-nextdevtpl/src/cli";

describe("create-nextdevtpl CLI", () => {
  it("parses a custom non-interactive selection", () => {
    expect(
      parseCliArguments([
        "my-app",
        "--preset",
        "custom",
        "--modules",
        "auth,dashboard,storage",
        "--storage",
        "s3-compatible",
        "--mail",
        "smtp",
        "--rate-limit",
        "noop",
        "--no-install",
        "--yes",
      ])
    ).toEqual({
      targetDirectory: "my-app",
      preset: "custom",
      modules: ["auth", "dashboard", "storage"],
      install: false,
      adapterOverrides: {
        storage: "storage:s3-compatible",
        mail: "mail:smtp",
        "rate-limit": "rate-limit:noop",
      },
    });
  });

  it("maps none to an explicit adapter removal", () => {
    expect(parseCliArguments(["my-app", "--ai", "none"])).toMatchObject({
      adapterOverrides: { ai: null },
    });
  });

  it("shows help without requiring a target", () => {
    expect(parseCliArguments(["--help"])).toBeNull();
  });

  it("rejects a missing target directory", () => {
    expect(() => parseCliArguments(["--preset", "minimal"])).toThrow(
      "target directory"
    );
  });
});
