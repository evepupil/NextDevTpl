import { describe, expect, it } from "vitest";

import { DEFAULT_DEMO_DATA } from "@/core/skin/demo/defaults";
import {
  changeDemoPlan,
  createDemoTicket,
  replyToDemoTicket,
} from "@/core/skin/demo/model";
import type { DemoData } from "@/core/skin/demo/types";

describe("演示动作的边界", () => {
  it("工单已达上限且样例时间在未来时，新建成功的编号仍能找到", () => {
    const template = DEFAULT_DEMO_DATA.support.tickets[0];
    if (!template) throw new Error("Default ticket is required");
    const data: DemoData = {
      ...DEFAULT_DEMO_DATA,
      support: {
        tickets: Array.from({ length: 50 }, (_, i) => ({
          ...template,
          id: `future-ticket-${i}`,
          createdAt: "2035-01-01T00:00:00.000Z",
          messages: [],
        })),
      },
    };
    const result = createDemoTicket(
      data,
      {
        category: "technical",
        priority: "medium",
        subject: "A current local ticket",
        message: "Created before the future sample tickets.",
      },
      "new-ticket",
      "new-message",
      "2026-11-07T00:00:00.000Z"
    );
    expect(result.data.support.tickets).toHaveLength(50);
    expect(
      result.data.support.tickets.find(
        (ticket) => ticket.id === result.ticketId
      )?.subject
    ).toBe("A current local ticket");
    expect(data.support.tickets).toHaveLength(50);
    expect(
      data.support.tickets.some((ticket) => ticket.id === "new-ticket")
    ).toBe(false);
  });

  it("消息已达上限且系统时间较早时，报告成功的回复仍保留", () => {
    const template = DEFAULT_DEMO_DATA.support.tickets[0];
    const message = template?.messages[0];
    if (!template || !message)
      throw new Error("Default conversation is required");
    const data: DemoData = {
      ...DEFAULT_DEMO_DATA,
      support: {
        tickets: [
          {
            ...template,
            messages: Array.from({ length: 50 }, (_, i) => ({
              ...message,
              id: `future-message-${i}`,
              createdAt: "2035-01-01T00:00:00.000Z",
            })),
          },
        ],
      },
    };
    const result = replyToDemoTicket(
      data,
      template.id,
      "A reply from the current local clock.",
      "new-reply",
      "2026-11-07T00:00:00.000Z"
    );
    expect(result).not.toBeNull();
    expect(result?.support.tickets[0]?.messages).toHaveLength(50);
    expect(
      result?.support.tickets[0]?.messages.some(
        (item) => item.id === "new-reply"
      )
    ).toBe(true);
    expect(
      data.support.tickets[0]?.messages.some((item) => item.id === "new-reply")
    ).toBe(false);
  });

  it("月末和闰年账期按真实月份计算，免费版恢复固定月付", () => {
    const monthly = changeDemoPlan(
      DEFAULT_DEMO_DATA,
      "ultra",
      "month",
      "monthly-change",
      "2027-01-31T12:00:00.000Z"
    );
    expect(monthly.workspace.plan.currentPeriodEnd).toBe(
      "2027-02-28T12:00:00.000Z"
    );
    const yearly = changeDemoPlan(
      DEFAULT_DEMO_DATA,
      "ultra",
      "year",
      "yearly-change",
      "2028-02-29T12:00:00.000Z"
    );
    expect(yearly.workspace.plan.currentPeriodEnd).toBe(
      "2029-02-28T12:00:00.000Z"
    );
    const free = changeDemoPlan(
      yearly,
      "free",
      "year",
      "free-change",
      "2028-03-01T12:00:00.000Z"
    );
    expect(free.workspace.plan).toMatchObject({
      id: "free",
      interval: "month",
      isActive: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    });
  });
});
