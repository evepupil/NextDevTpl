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
      skin: { kind: "builtin", id: "default" },
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

  it("supports selecting the structured analytics logger", () => {
    expect(parseCliArguments(["my-app", "--analytics", "logger"])).toEqual(
      expect.objectContaining({
        adapterOverrides: { analytics: "analytics:logger" },
      })
    );
  });

  it("supports selecting an operations alert adapter", () => {
    expect(parseCliArguments(["my-app", "--alerts", "webhook"])).toEqual(
      expect.objectContaining({
        adapterOverrides: { alerts: "alerts:webhook" },
      })
    );
  });

  it("shows help without requiring a target", () => {
    expect(parseCliArguments(["--help"])).toBeNull();
  });

  it("rejects a missing target directory", () => {
    expect(() => parseCliArguments(["--preset", "minimal"])).toThrow(
      "target directory"
    );
  });

  it("distinguishes the built-in identifier from a directory with the same name", () => {
    expect(parseCliArguments(["app", "--skin", "default"])).toMatchObject({
      skin: { kind: "builtin", id: "default" },
    });
    expect(parseCliArguments(["app", "--skin", "./default"])).toMatchObject({
      skin: { kind: "local", directory: "./default" },
    });
  });

  it.each([
    "C:\\skins\\clean",
    "C:/skins/clean",
    "\\\\server\\skins\\clean",
  ])("accepts Windows local skin paths: %s", (directory) => {
    expect(parseCliArguments(["app", "--skin", directory])).toMatchObject({
      skin: { kind: "local", directory },
    });
  });

  it("records a remote digest and only the credential variable name", () => {
    expect(
      parseCliArguments([
        "app",
        "--skin",
        "https://skins.example.test/skin.tgz",
        "--skin-sha256",
        "A".repeat(64),
        "--skin-token-env",
        "PRIVATE_SKIN_TOKEN",
      ])
    ).toMatchObject({
      skin: {
        kind: "remote",
        url: "https://skins.example.test/skin.tgz",
        sha256: "a".repeat(64),
        tokenEnv: "PRIVATE_SKIN_TOKEN",
      },
    });
  });

  it.each(
    [
      ["--skin", "https://skins.example.test/skin.tgz"],
      ["--skin", "local-skin", "--skin-sha256", "a".repeat(64)],
      ["--skin-token-env", "PRIVATE_SKIN_TOKEN"],
      ["--skin", "default", "--skin", "other"],
      [
        "--skin",
        "https://user:secret@example.test/a",
        "--skin-sha256",
        "a".repeat(64),
      ],
      [
        "--skin",
        "https://example.test/a?token=secret",
        "--skin-sha256",
        "a".repeat(64),
      ],
      ["--skin", "http://example.test/a", "--skin-sha256", "a".repeat(64)],
    ].map((flags) => ({ flags }))
  )("rejects invalid source combinations: $flags", ({ flags }) => {
    expect(() => parseCliArguments(["app", ...flags])).toThrow();
  });

  it("does not echo a literal credential passed using an unsupported option", () => {
    let error: unknown;
    try {
      parseCliArguments(["app", "--skin-token=fixture-credential-marker"]);
    } catch (failure) {
      error = failure;
    }
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain("fixture-credential-marker");
  });
});
