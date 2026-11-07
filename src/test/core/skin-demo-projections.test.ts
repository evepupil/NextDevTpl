import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DEMO_DATA } from "@/core/skin/demo/defaults";
import {
  projectBillingHistory,
  projectCreditUsage,
  projectDashboardOverview,
  projectSupportDetail,
  projectSupportList,
  resolveDemoAssetUrl,
} from "@/core/skin/demo/projections";
import { serializeDemoData } from "@/core/skin/demo/serialization";
import type { DemoData } from "@/core/skin/demo/types";

describe("演示页面的数据投影", () => {
  it("交易倒序、同时间稳定、分页正确，显示投影不改动原数据摘要", () => {
    const before = structuredClone(DEFAULT_DEMO_DATA);
    const transaction = before.workspace.credits.transactions[0];
    if (!transaction) throw new Error("Default transaction is required");
    const data: DemoData = {
      ...before,
      workspace: {
        ...before.workspace,
        credits: {
          ...before.workspace.credits,
          transactions: [
            {
              ...transaction,
              id: "old",
              createdAt: "2026-11-01T00:00:00.000Z",
            },
            {
              ...transaction,
              id: "same-a",
              createdAt: "2026-11-03T00:00:00.000Z",
            },
            {
              ...transaction,
              id: "same-b",
              createdAt: "2026-11-03T00:00:00.000Z",
            },
            {
              ...transaction,
              id: "new",
              createdAt: "2026-11-04T00:00:00.000Z",
            },
          ],
        },
      },
    };
    const serialized = serializeDemoData(data);
    const describeTransaction = vi.fn(
      (item: { id: string }) => `Description ${item.id}`
    );
    const page = projectCreditUsage(data, {
      page: 2,
      pageSize: 2,
      describeTransaction,
    });
    expect(page.totalCount).toBe(4);
    expect(page.totalPages).toBe(2);
    expect(page.transactions.map((item) => item.id)).toEqual(["same-b", "old"]);
    expect(page.transactions[0]?.displayDescription).toBe("Description same-b");
    expect(describeTransaction).toHaveBeenCalledTimes(2);
    expect(
      projectDashboardOverview(data).credits?.transactions.map(
        (item) => item.id
      )
    ).toEqual(["new", "same-a", "same-b", "old"]);
    expect(serializeDemoData(data)).toBe(serialized);
  });

  it("最近到期批次按样例参考时间计算，与运行日期无关", () => {
    const data: DemoData = {
      ...DEFAULT_DEMO_DATA,
      workspace: {
        ...DEFAULT_DEMO_DATA.workspace,
        credits: {
          ...DEFAULT_DEMO_DATA.workspace.credits,
          batches: [
            { remaining: 250, expiresAt: "2026-12-10T00:00:00.000Z" },
            { remaining: 300, expiresAt: null },
            { remaining: 200, expiresAt: "2026-11-08T00:00:00.000Z" },
          ],
        },
      },
    };
    const before = serializeDemoData(data);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2040-01-01T00:00:00.000Z"));
    try {
      const usage = projectCreditUsage(data, {
        page: 1,
        pageSize: 10,
        describeTransaction: () => "",
      });
      expect(usage.expiringBatch).toEqual({
        remaining: 200,
        expiresAt: "2026-11-08T00:00:00.000Z",
      });
      expect(usage.balance).toBe(750);
      expect(serializeDemoData(data)).toBe(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it("工单列表倒序、消息正序并稳定保留相同时间顺序", () => {
    const ticket = DEFAULT_DEMO_DATA.support.tickets[0];
    if (!ticket) throw new Error("Default ticket is required");
    const message = ticket.messages[0];
    if (!message) throw new Error("Default message is required");
    const data: DemoData = {
      ...DEFAULT_DEMO_DATA,
      support: {
        tickets: [
          { ...ticket, id: "old" },
          {
            ...ticket,
            id: "new-a",
            createdAt: "2026-11-05T00:00:00.000Z",
            messages: [
              {
                ...message,
                id: "later",
                createdAt: "2026-11-06T00:00:00.000Z",
              },
              {
                ...message,
                id: "same-a",
                createdAt: "2026-11-05T00:00:00.000Z",
              },
              {
                ...message,
                id: "same-b",
                createdAt: "2026-11-05T00:00:00.000Z",
              },
            ],
          },
          {
            ...ticket,
            id: "new-b",
            createdAt: "2026-11-05T00:00:00.000Z",
            messages: [],
          },
        ],
      },
    };
    const before = serializeDemoData(data);
    expect(
      projectSupportList(data, "zh").tickets.map((item) => item.id)
    ).toEqual(["new-a", "new-b", "old"]);
    const detail = projectSupportDetail(data, "new-a", "zh");
    expect(detail?.messages.map((item) => item.id)).toEqual([
      "same-a",
      "same-b",
      "later",
    ]);
    expect(detail?.locale).toBe("zh");
    expect(detail?.currentUserId).toBe(data.workspace.user.id);
    expect(detail?.messages[0]?.user?.name).toBe(data.workspace.user.name);
    expect(projectSupportDetail(data, "missing", "en")).toBeNull();
    expect(serializeDemoData(data)).toBe(before);
  });

  it("账单显示取共用套餐名，倒序不改动记录数组", () => {
    const item = DEFAULT_DEMO_DATA.workspace.billingHistory[0];
    if (!item) throw new Error("Default billing record is required");
    const data: DemoData = {
      ...DEFAULT_DEMO_DATA,
      workspace: {
        ...DEFAULT_DEMO_DATA.workspace,
        billingHistory: [
          item,
          {
            ...item,
            id: "changed",
            eventType: "changed",
            fromPlanId: "pro",
            toPlanId: "ultra",
            createdAt: "2026-11-06T00:00:00.000Z",
          },
        ],
      },
    };
    const before = serializeDemoData(data);
    expect(projectBillingHistory(data)[0]).toMatchObject({
      id: "changed",
      fromPlanName: "Pro",
      toPlanName: "Ultra",
    });
    expect(serializeDemoData(data)).toBe(before);
    expect(resolveDemoAssetUrl(null)).toBeNull();
    expect(resolveDemoAssetUrl("assets/avatar.png")).toBe(
      "/skin-assets/assets/avatar.png"
    );
  });
});
