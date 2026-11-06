import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigateAfterSignOut } from "@/lib/auth/navigation";

const mocks = vi.hoisted(() => ({
  getPathname: vi.fn(
    ({ href, locale }: { href: string; locale: string }) => `/${locale}${href}`
  ),
}));

vi.mock("@/config/auth-navigation", () => ({
  authNavigation: { afterSignOut: "/sign-in" },
}));
vi.mock("@/i18n/routing", () => ({ getPathname: mocks.getPathname }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("navigateAfterSignOut", () => {
  it("uses the configured destination and current locale for a full navigation", () => {
    const navigate = vi.fn<(href: string) => void>();

    navigateAfterSignOut("zh", navigate);

    expect(mocks.getPathname).toHaveBeenCalledWith({
      href: "/sign-in",
      locale: "zh",
      forcePrefix: true,
    });
    expect(navigate).toHaveBeenCalledWith("/zh/sign-in");
  });
});
