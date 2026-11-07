// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { FormEvent, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSignInController,
  useSignUpController,
} from "@/core/skin/demo/controllers/auth";
import { usePricingController } from "@/core/skin/demo/controllers/marketing";
import { useSettingsBillingController } from "@/core/skin/demo/controllers/settings";
import { useCreateTicketController } from "@/core/skin/demo/controllers/support";
import { DEFAULT_DEMO_DATA } from "@/core/skin/demo/defaults";
import { DemoStoreProvider, useDemoStore } from "@/core/skin/demo/store";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useSearchParams: () => new URLSearchParams("token=local-demo"),
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => "/dashboard/settings",
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <DemoStoreProvider>{children}</DemoStoreProvider>
);

function submitEvent() {
  return {
    preventDefault: vi.fn(),
  } as unknown as FormEvent<HTMLFormElement>;
}

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe("演示表单业务逻辑", () => {
  it("同套餐从月付改年付，当前标记、金额和账期同步", async () => {
    const hook = renderHook(
      () => ({ store: useDemoStore(), pricing: usePricingController() }),
      { wrapper }
    );
    expect(hook.result.current.store.state.data.workspace.plan.interval).toBe(
      "month"
    );
    expect(
      hook.result.current.pricing.plans.find((plan) => plan.id === "pro")
        ?.isCurrent
    ).toBe(true);
    act(() => hook.result.current.pricing.setIsYearly(true));
    const yearly = hook.result.current.pricing.plans.find(
      (plan) => plan.id === "pro"
    );
    expect(yearly).toMatchObject({
      isCurrent: false,
      price: 65,
      credits: 96000,
    });
    await act(async () => {
      hook.result.current.pricing.onSubscribe("pro");
    });
    expect(hook.result.current.store.state.data.workspace.plan).toMatchObject({
      id: "pro",
      interval: "year",
      isActive: true,
    });
    expect(
      hook.result.current.pricing.plans.find((plan) => plan.id === "pro")
        ?.isCurrent
    ).toBe(true);
    expect(
      hook.result.current.store.state.data.workspace.billingHistory.length
    ).toBe(DEFAULT_DEMO_DATA.workspace.billingHistory.length + 1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("取消恢复立即反馈，记录仅保存在本地，重复取消不重复记账", async () => {
    const hook = renderHook(
      () => ({
        store: useDemoStore(),
        billing: useSettingsBillingController(),
      }),
      { wrapper }
    );
    await act(async () => {
      hook.result.current.billing.actions.onCancelSubscription();
    });
    expect(hook.result.current.billing.state.isCancelPending).toBe(true);
    const count =
      hook.result.current.store.state.data.workspace.billingHistory.length;
    await act(async () => {
      hook.result.current.billing.actions.onCancelSubscription();
    });
    expect(
      hook.result.current.store.state.data.workspace.billingHistory.length
    ).toBe(count);
    await act(async () => {
      hook.result.current.billing.actions.onResumeSubscription();
    });
    expect(hook.result.current.billing.state.isCancelPending).toBe(false);
    expect(hook.result.current.billing.model.currentPlanName).toBe("Pro");
    expect(hook.result.current.billing.model.priceDisplay).toBe("$9");
    expect(mocks.error).not.toHaveBeenCalled();
    expect(mocks.success).toHaveBeenCalled();
  });

  it("登录和注册沿用必填、最小密码与确认一致规则，成功后恢复本地用户", async () => {
    const hook = renderHook(
      () => ({
        store: useDemoStore(),
        login: useSignInController(),
        signup: useSignUpController(),
      }),
      { wrapper }
    );
    act(() => hook.result.current.store.actions.signOut());
    await act(async () => {
      await hook.result.current.login.actions.onSubmit(submitEvent());
    });
    expect(hook.result.current.login.state.error).toBeTruthy();
    expect(hook.result.current.store.state.sessionUserId).toBeNull();
    act(() => {
      hook.result.current.login.actions.onEmailChange("demo@example.test");
      hook.result.current.login.actions.onPasswordChange("Demo-Password-2026");
    });
    await act(async () => {
      await hook.result.current.login.actions.onSubmit(submitEvent());
    });
    expect(hook.result.current.store.state.sessionUserId).toBe(
      DEFAULT_DEMO_DATA.workspace.user.id
    );
    expect([
      ...mocks.push.mock.calls,
      ...mocks.replace.mock.calls,
    ]).toContainEqual(["/dashboard"]);
    act(() => {
      hook.result.current.store.actions.signOut();
      hook.result.current.signup.actions.onNameChange("Taylor");
      hook.result.current.signup.actions.onEmailChange("new@example.test");
      hook.result.current.signup.actions.onPasswordChange("Demo-Password-2026");
      hook.result.current.signup.actions.onConfirmPasswordChange(
        "Mismatch-Password-2026"
      );
    });
    await act(async () => {
      await hook.result.current.signup.actions.onSubmit(submitEvent());
    });
    expect(hook.result.current.signup.state.error).toMatch(
      /passwordMismatch$/u
    );
    expect(hook.result.current.store.state.sessionUserId).toBeNull();
    act(() =>
      hook.result.current.signup.actions.onConfirmPasswordChange(
        "Demo-Password-2026"
      )
    );
    await act(async () => {
      await hook.result.current.signup.actions.onSubmit(submitEvent());
    });
    expect(hook.result.current.store.state.sessionUserId).toBe(
      DEFAULT_DEMO_DATA.workspace.user.id
    );
    expect(JSON.stringify(hook.result.current.store.state)).not.toContain(
      "Demo-Password-2026"
    );
  });

  it("工单校验失败不改状态，通过后返回本地可访问编号", async () => {
    const hook = renderHook(
      () => ({ store: useDemoStore(), ticket: useCreateTicketController() }),
      { wrapper }
    );
    act(() => {
      hook.result.current.ticket.actions.setSubject("A valid subject");
      hook.result.current.ticket.actions.setMessage("x");
    });
    await act(async () => {
      await hook.result.current.ticket.actions.onSubmit(submitEvent());
    });
    expect(hook.result.current.store.state.data.support.tickets).toHaveLength(
      DEFAULT_DEMO_DATA.support.tickets.length
    );
    expect(mocks.error).toHaveBeenLastCalledWith("Support.pages.createFailed");
    expect(mocks.push).not.toHaveBeenCalled();
    act(() =>
      hook.result.current.ticket.actions.setMessage(
        "A complete local support request."
      )
    );
    await act(async () => {
      await hook.result.current.ticket.actions.onSubmit(submitEvent());
    });
    const created = hook.result.current.store.state.data.support.tickets.find(
      (ticket) => ticket.subject === "A valid subject"
    );
    expect(created).toBeDefined();
    expect(mocks.push).toHaveBeenLastCalledWith(
      `/dashboard/support/${created?.id}`
    );
    expect(created?.messages[0]?.content).toBe(
      "A complete local support request."
    );
  });
});
