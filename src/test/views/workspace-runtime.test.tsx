// @vitest-environment jsdom

import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  creditRequests: 0,
  planRequests: 0,
  planUnmounts: 0,
  router: { push: vi.fn() },
  user: null as {
    email: string;
    id: string;
    image: string | null;
    name: string;
  } | null,
}));

function MockLink({ href, children, ...props }: ComponentProps<"a">) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

vi.mock("@/features/auth/view", () => ({
  useWorkspaceSessionController: () => ({
    user: mocks.user,
    onSignOut: vi.fn(),
  }),
}));

vi.mock("@/features/credits/view", async () => {
  const { useEffect } = await import("react");

  return {
    useBalanceBadgeController: () => {
      useEffect(() => {
        mocks.creditRequests += 1;
      }, []);

      return { balance: 120, isPending: false };
    },
  };
});

vi.mock("@/features/subscription/view", async () => {
  const { useEffect } = await import("react");

  return {
    usePlanBadgeController: () => {
      useEffect(() => {
        mocks.planRequests += 1;
        return () => {
          mocks.planUnmounts += 1;
        };
      }, []);

      return { id: "free" };
    },
  };
});

vi.mock("@/i18n/routing", () => ({
  Link: MockLink,
  usePathname: () => "/dashboard",
  useRouter: () => mocks.router,
}));

vi.mock("@/features/shared", () => ({
  ModeToggle: () => <button type="button">Theme</button>,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

import { DashboardSidebar } from "@/skin/views/shared/sidebar";
import { SidebarProvider } from "@/skin/views/shared/sidebar-context";

function renderSidebar() {
  return render(
    <SidebarProvider>
      <DashboardSidebar />
    </SidebarProvider>
  );
}

beforeEach(() => {
  mocks.creditRequests = 0;
  mocks.planRequests = 0;
  mocks.planUnmounts = 0;
  mocks.user = null;
  mocks.router.push.mockReset();
});

describe("workspace account badge requests", () => {
  it("loads credits with the user and plans only while the account menu is open", async () => {
    const view = renderSidebar();

    expect(mocks.creditRequests).toBe(0);
    expect(mocks.planRequests).toBe(0);

    mocks.user = {
      email: "person@example.com",
      id: "user-1",
      image: null,
      name: "Jane Doe",
    };
    view.rerender(
      <SidebarProvider>
        <DashboardSidebar />
      </SidebarProvider>
    );

    await waitFor(() => expect(mocks.creditRequests).toBe(1));
    expect(mocks.planRequests).toBe(0);

    const accountButton = screen.getByRole("button", { name: /Jane Doe/ });
    fireEvent.click(accountButton);
    await waitFor(() => expect(mocks.planRequests).toBe(1));

    fireEvent.click(accountButton);
    await waitFor(() => expect(mocks.planUnmounts).toBe(1));
    expect(mocks.creditRequests).toBe(1);

    fireEvent.click(accountButton);
    await waitFor(() => expect(mocks.planRequests).toBe(2));
    expect(mocks.creditRequests).toBe(1);
  });
});
