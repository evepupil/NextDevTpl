import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanRuntimeValue,
  getRuntimeEnv,
  getRuntimeEnvironment,
} from "@/lib/runtime-config";

describe("runtime configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("removes a UTF-8 BOM and surrounding whitespace", () => {
    expect(cleanRuntimeValue("\uFEFF  secret-value  ")).toBe("secret-value");
    expect(cleanRuntimeValue("   ")).toBeUndefined();
    expect(cleanRuntimeValue(42)).toBeUndefined();
  });

  it("reads cleaned process environment values", () => {
    vi.stubEnv("RUNTIME_CONFIG_TEST", "\uFEFF value ");

    expect(getRuntimeEnv("RUNTIME_CONFIG_TEST")).toBe("value");
    expect(getRuntimeEnvironment(["RUNTIME_CONFIG_TEST"])).toEqual({
      RUNTIME_CONFIG_TEST: "value",
    });
  });
});
