// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_DEMO_DATA } from "@/core/skin/demo/defaults";
import { DemoStoreProvider, useDemoStore } from "@/core/skin/demo/store";
import type { DemoData } from "@/core/skin/demo/types";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mount(initialData?: DemoData) {
  return renderHook(() => useDemoStore(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <DemoStoreProvider {...(initialData ? { initialData } : {})}>
        {children}
      </DemoStoreProvider>
    ),
  });
}

describe("标签页内的演示状态", () => {
  it("每个实例独立复制样例，销毁后恢复初始数据", () => {
    const initial = structuredClone(DEFAULT_DEMO_DATA);
    const first = mount(initial);
    const second = mount(initial);
    act(() => first.result.current.actions.updateProfile({ name: "Taylor" }));
    expect(first.result.current.state.data.workspace.user.name).toBe("Taylor");
    expect(second.result.current.state.data.workspace.user.name).toBe(
      initial.workspace.user.name
    );
    expect(initial).toEqual(DEFAULT_DEMO_DATA);
    first.unmount();
    const refreshed = mount(initial);
    expect(refreshed.result.current.state.data).toEqual(initial);
  });

  it("退出清除身份，登录恢复固定本地用户，数据不会写入浏览器存储", () => {
    const hook = mount();
    const before = JSON.stringify({ ...localStorage });
    act(() => hook.result.current.actions.updateProfile({ name: "Taylor" }));
    act(() => hook.result.current.actions.signOut());
    expect(hook.result.current.state.sessionUserId).toBeNull();
    expect(hook.result.current.state.data.workspace.user.name).toBe("Taylor");
    act(() => hook.result.current.actions.signIn());
    expect(hook.result.current.state.sessionUserId).toBe(
      DEFAULT_DEMO_DATA.workspace.user.id
    );
    expect(JSON.stringify({ ...localStorage })).toBe(before);
    expect(JSON.stringify(hook.result.current.state)).not.toContain("password");
  });

  it("删号清理本地改动与会话，再次注册恢复演示用户", () => {
    const hook = mount();
    act(() => hook.result.current.actions.updateProfile({ name: "Taylor" }));
    act(() => hook.result.current.actions.deleteAccount());
    expect(hook.result.current.state.sessionUserId).toBeNull();
    expect(hook.result.current.state.data).toEqual(DEFAULT_DEMO_DATA);
    act(() => hook.result.current.actions.signUp());
    expect(hook.result.current.state.sessionUserId).toBe(
      DEFAULT_DEMO_DATA.workspace.user.id
    );
  });

  it("同一批交互中的新工单与回复不会互相覆盖", () => {
    const hook = mount();
    const input = {
      subject: "Question about local workspace",
      message: "A local message without a server request.",
      category: "technical" as const,
      priority: "medium" as const,
    };
    let first = "";
    let second = "";
    act(() => {
      first = hook.result.current.actions.createTicket(input);
      second = hook.result.current.actions.createTicket(input);
    });
    expect(first).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/u);
    expect(second).not.toBe(first);
    expect(hook.result.current.state.data.support.tickets).toHaveLength(
      DEFAULT_DEMO_DATA.support.tickets.length + 2
    );
    let replied = false;
    act(() => {
      replied = hook.result.current.actions.replyToTicket(
        first,
        "A local reply"
      );
    });
    expect(replied).toBe(true);
    const ticket = hook.result.current.state.data.support.tickets.find(
      (item) => item.id === first
    );
    expect(ticket?.messages.map((message) => message.content)).toEqual([
      input.message,
      "A local reply",
    ]);
    expect(
      ticket?.messages.every(
        (message) => message.author.kind === "current-user"
      )
    ).toBe(true);
    expect(
      DEFAULT_DEMO_DATA.support.tickets.some((item) => item.id === first)
    ).toBe(false);
  });

  it("不存在或已关闭工单不能回复", () => {
    const initial = structuredClone(DEFAULT_DEMO_DATA);
    const ticket = initial.support.tickets[0];
    if (!ticket) throw new Error("Default ticket is required");
    const closed: DemoData = {
      ...initial,
      support: { tickets: [{ ...ticket, status: "closed" }] },
    };
    const hook = mount(closed);
    act(() => {
      expect(
        hook.result.current.actions.replyToTicket("missing", "Reply")
      ).toBe(false);
      expect(
        hook.result.current.actions.replyToTicket(ticket.id, "Reply")
      ).toBe(false);
    });
    expect(hook.result.current.state.data.support.tickets[0]?.messages).toEqual(
      ticket.messages
    );
  });

  it("套餐周期与取消恢复写入本地账单，保持原样例不变", () => {
    const hook = mount();
    act(() => hook.result.current.actions.setBillingInterval("year"));
    expect(hook.result.current.state.billingInterval).toBe("year");
    act(() => hook.result.current.actions.cancelSubscription());
    expect(
      hook.result.current.state.data.workspace.plan.cancelAtPeriodEnd
    ).toBe(true);
    act(() => hook.result.current.actions.resumeSubscription());
    expect(
      hook.result.current.state.data.workspace.plan.cancelAtPeriodEnd
    ).toBe(false);
    act(() => hook.result.current.actions.changePlan("ultra", "year"));
    expect(hook.result.current.state.data.workspace.plan.id).toBe("ultra");
    expect(hook.result.current.state.data.workspace.plan.interval).toBe("year");
    const history = hook.result.current.state.data.workspace.billingHistory;
    expect(history.length).toBeGreaterThan(
      DEFAULT_DEMO_DATA.workspace.billingHistory.length
    );
    expect(
      history.some((item) => item.eventType === "cancellation_requested")
    ).toBe(true);
    expect(
      history.some((item) => item.eventType === "cancellation_resumed")
    ).toBe(true);
    expect(DEFAULT_DEMO_DATA.workspace.plan.id).toBe("pro");
    expect(DEFAULT_DEMO_DATA.workspace.plan.cancelAtPeriodEnd).toBe(false);
  });

  it("头像预览独立于演示数据，替换和销毁时释放旧地址", () => {
    const revoke = vi.fn();
    const BrowserURL = URL;
    vi.stubGlobal(
      "URL",
      class extends BrowserURL {
        static revokeObjectURL = revoke;
      }
    );
    const hook = mount();
    act(() => hook.result.current.actions.setAvatarPreview("blob:first"));
    expect(hook.result.current.state.avatarPreview).toBe("blob:first");
    expect(hook.result.current.state.data.workspace.user.image).toBeNull();
    act(() => hook.result.current.actions.setAvatarPreview("blob:second"));
    expect(revoke).toHaveBeenCalledWith("blob:first");
    hook.unmount();
    expect(revoke).toHaveBeenCalledWith("blob:second");
  });
});
