import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCloudflareContext } = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

import {
  createCloudflareBindingMap,
  createLazyCloudflareBinding,
} from "@/lib/cloudflare/bindings";

interface TestBinding {
  read(value: string): Promise<string>;
}

describe("Cloudflare runtime bindings", () => {
  beforeEach(() => {
    getCloudflareContext.mockReset();
  });

  it("reads the request context only when a binding method is called", async () => {
    const read = vi.fn(async (value: string) => `bound:${value}`);
    getCloudflareContext.mockReturnValue({ env: { TEST_BINDING: { read } } });

    const binding = createLazyCloudflareBinding<TestBinding>("TEST_BINDING");

    expect(getCloudflareContext).not.toHaveBeenCalled();
    await expect(binding.read("value")).resolves.toBe("bound:value");
    expect(getCloudflareContext).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledWith("value");
  });

  it("maps every logical name to one physical binding", async () => {
    const read = vi.fn(async (value: string) => value);
    getCloudflareContext.mockReturnValue({ env: { SHARED: { read } } });

    const bindings = createCloudflareBindingMap<TestBinding>("SHARED");

    await bindings.uploads?.read("first");
    await bindings.avatars?.read("second");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("reports a missing physical binding with its name", () => {
    getCloudflareContext.mockReturnValue({ env: {} });
    const binding = createLazyCloudflareBinding<TestBinding>("MISSING");

    expect(() => binding.read).toThrow(
      "Cloudflare binding is not configured: MISSING"
    );
  });
});
