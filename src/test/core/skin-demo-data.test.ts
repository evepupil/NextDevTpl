import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DEMO_DATA,
  mergeDemoData,
  parseDemoDataPatch,
  serializeDemoData,
  validateDemoData,
} from "@/core/skin/demo";

function sample() {
  return structuredClone(DEFAULT_DEMO_DATA);
}

function expectInvalid(input: unknown) {
  expect(() => validateDemoData(input)).toThrow();
}

afterEach(() => vi.useRealTimers());

describe("演示数据的完整校验", () => {
  it("默认样例使用固定参考时间，实际运行日期不影响到期规则", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2040-01-01T00:00:00.000Z"));
    const data = validateDemoData(sample());
    expect(data.snapshotAt).toBe("2026-11-07T00:00:00.000Z");
    expect(data.workspace.user.email).toMatch(/\.test$/);
    expect(data.workspace.credits.balance).toBeGreaterThan(0);
  });

  it("所有层级拒绝未登记字段和业务配置", () => {
    const data = sample();
    for (const invalid of [
      { ...data, pricing: {} },
      { ...data, workspace: { ...data.workspace, provider: "stripe" } },
      {
        ...data,
        workspace: {
          ...data.workspace,
          plan: { ...data.workspace.plan, price: 1 },
        },
      },
      {
        ...data,
        support: {
          tickets: [{ ...data.support.tickets[0], actions: { reply: true } }],
        },
      },
    ]) {
      expectInvalid(invalid);
    }
  });

  it("拒绝原型键、带自定义原型的对象以及稀疏数组", () => {
    const data = sample();
    expectInvalid(JSON.parse('{"schemaVersion":1,"__proto__":{}}'));
    expectInvalid(Object.assign(Object.create({ schemaVersion: 1 }), data));
    expectInvalid({
      ...data,
      support: { tickets: new Array(1) },
    });
    expect(() =>
      parseDemoDataPatch(JSON.parse('{"schemaVersion":1,"constructor":{}}'))
    ).toThrow();
  });

  it.each([null, [], "data", 1, { schemaVersion: 2 }])(
    "拒绝无效根数据 %j",
    expectInvalid
  );

  it("整数必须安全且符合正负范围", () => {
    const data = sample();
    for (const balance of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
      expectInvalid({
        ...data,
        workspace: {
          ...data.workspace,
          credits: { ...data.workspace.credits, balance },
        },
      });
    }
    expectInvalid({
      ...data,
      workspace: {
        ...data.workspace,
        credits: {
          ...data.workspace.credits,
          transactions: [
            {
              id: "tx-zero",
              type: "purchase",
              amount: 0,
              description: null,
              createdAt: data.snapshotAt,
            },
          ],
        },
      },
    });
  });

  it("批次余额合计必须准确，且在样例参考时间尚未到期", () => {
    const data = sample();
    for (const batches of [
      [{ remaining: data.workspace.credits.balance + 1, expiresAt: null }],
      [
        {
          remaining: data.workspace.credits.balance,
          expiresAt: "2026-11-06T00:00:00.000Z",
        },
      ],
    ]) {
      expectInvalid({
        ...data,
        workspace: {
          ...data.workspace,
          credits: { ...data.workspace.credits, batches },
        },
      });
    }
    expect(() =>
      validateDemoData({
        ...data,
        workspace: {
          ...data.workspace,
          credits: { ...data.workspace.credits, transactions: [] },
        },
      })
    ).not.toThrow();
  });

  it.each([
    "2026-11-07",
    "2026-11-07T00:00:00Z",
    "2026-11-07T08:00:00.000+08:00",
    "2026-02-30T00:00:00.000Z",
  ])("只接受规范 UTC 时间 %s", (snapshotAt) => {
    expectInvalid({ ...sample(), snapshotAt });
  });

  it("用户编号、邮箱、姓名和头像路径有严格边界", () => {
    const data = sample();
    for (const patch of [
      { id: "../user" },
      { id: "a".repeat(65) },
      { name: "a".repeat(81) },
      { email: "a".repeat(255) },
      { image: "https://example.test/avatar.png" },
      { image: "blob:avatar" },
      { image: "../avatar.png" },
    ]) {
      expectInvalid({
        ...data,
        workspace: {
          ...data.workspace,
          user: { ...data.workspace.user, ...patch },
        },
      });
    }
  });

  it("交易编号不能重复，月度赠送须引用付费计划与周期", () => {
    const data = sample();
    const transaction = {
      id: "grant-1",
      type: "monthly_grant",
      amount: 100,
      description: null,
      createdAt: data.snapshotAt,
    };
    const check = (transactions: unknown) => ({
      ...data,
      workspace: {
        ...data.workspace,
        credits: { ...data.workspace.credits, transactions },
      },
    });
    for (const invalid of [
      [transaction],
      [{ ...transaction, grant: { planId: "free", interval: "month" } }],
      [{ ...transaction, grant: { planId: "pro", interval: "weekly" } }],
      [
        {
          ...transaction,
          type: "purchase",
          grant: { planId: "pro", interval: "month" },
        },
      ],
      [
        { ...transaction, grant: { planId: "pro", interval: "year" } },
        { ...transaction, grant: { planId: "pro", interval: "month" } },
      ],
    ]) {
      expectInvalid(check(invalid));
    }
    expect(() =>
      validateDemoData(
        check([{ ...transaction, grant: { planId: "pro", interval: "year" } }])
      )
    ).not.toThrow();
  });

  it("免费套餐、取消和待切换状态互相约束", () => {
    const data = sample();
    for (const patch of [
      { id: "free", isActive: true },
      { id: "free", interval: "year", isActive: false },
      { id: "unknown" },
      { cancelAtPeriodEnd: true, isActive: false },
      { cancelAtPeriodEnd: true, currentPeriodEnd: null },
      { pendingPlanId: "starter", pendingPriceEffectiveAt: null },
      { pendingPlanId: null, pendingPriceEffectiveAt: data.snapshotAt },
    ]) {
      expectInvalid({
        ...data,
        workspace: {
          ...data.workspace,
          plan: { ...data.workspace.plan, ...patch },
        },
      });
    }
  });

  it("工单和消息枚举、作者、编号、长度与时间关系都受约束", () => {
    const data = sample();
    const ticket = data.support.tickets[0];
    expect(ticket).toBeDefined();
    if (!ticket) throw new Error("Default ticket is required");
    const message = ticket.messages[0];
    if (!message) throw new Error("Default message is required");
    for (const patch of [
      { status: "unknown" },
      { category: "unknown" },
      { priority: "urgent" },
      { subject: "x" },
      { messages: [{ ...message, content: "x".repeat(5001) }] },
      { messages: [{ ...message, createdAt: "2000-01-01T00:00:00.000Z" }] },
      { messages: [message, message] },
      {
        messages: [
          { ...message, author: { kind: "current-user", name: "extra" } },
        ],
      },
      { messages: [{ ...message, author: { kind: "staff", id: "staff" } }] },
    ]) {
      expectInvalid({
        ...data,
        support: { tickets: [{ ...ticket, ...patch }] },
      });
    }
    expectInvalid({ ...data, support: { tickets: [ticket, ticket] } });
    expectInvalid({
      ...data,
      support: {
        tickets: Array.from({ length: 51 }, (_, i) => ({
          ...ticket,
          id: `ticket-${i}`,
        })),
      },
    });
  });
});

describe("皮肤演示数据的覆盖和稳定序列化", () => {
  it("覆盖必须声明版本，只有声明可空的字段接受 null", () => {
    for (const patch of [
      {},
      { schemaVersion: 2 },
      { schemaVersion: 1, workspace: { user: { name: null } } },
      { schemaVersion: 1, workspace: { user: { price: 1 } } },
      { schemaVersion: 1, support: { tickets: [{ id: "incomplete" }] } },
    ]) {
      expect(() => parseDemoDataPatch(patch)).toThrow();
    }
    expect(
      parseDemoDataPatch({
        schemaVersion: 1,
        workspace: { user: { image: null } },
      })
    ).toEqual({ schemaVersion: 1, workspace: { user: { image: null } } });
  });

  it("对象递归覆盖、数组整表替换，合并不改变任一输入", () => {
    const base = sample();
    const before = JSON.stringify(base);
    const patch = parseDemoDataPatch({
      schemaVersion: 1,
      workspace: { user: { name: "Taylor" }, credits: { transactions: [] } },
      support: { tickets: [] },
    });
    const patchBefore = JSON.stringify(patch);
    const merged = mergeDemoData(base, patch);
    expect(merged.workspace.user.name).toBe("Taylor");
    expect(merged.workspace.user.email).toBe(base.workspace.user.email);
    expect(merged.workspace.credits.transactions).toEqual([]);
    expect(merged.support.tickets).toEqual([]);
    expect(JSON.stringify(base)).toBe(before);
    expect(JSON.stringify(patch)).toBe(patchBefore);
  });

  it("局部合法的覆盖在合并后仍必须满足完整业务规则", () => {
    const patch = parseDemoDataPatch({
      schemaVersion: 1,
      workspace: { credits: { balance: 1 } },
    });
    expect(() => mergeDemoData(sample(), patch)).toThrow();
  });

  it("对象键顺序不影响规范结果，数组次序保留且输入不变", () => {
    const data = sample();
    const before = JSON.stringify(data);
    const reordered = Object.fromEntries(Object.entries(data).reverse());
    const serialized = serializeDemoData(data);
    expect(serializeDemoData(validateDemoData(reordered))).toBe(serialized);
    expect(Object.keys(JSON.parse(serialized))).toEqual([
      "schemaVersion",
      "snapshotAt",
      "support",
      "workspace",
    ]);
    expect(JSON.parse(serialized).workspace.credits.transactions).toEqual(
      data.workspace.credits.transactions
    );
    expect(JSON.stringify(data)).toBe(before);
  });
});
