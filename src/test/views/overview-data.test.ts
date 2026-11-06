import { afterAll, describe, expect, it, vi } from "vitest";

import { creditsTransaction } from "@/db/schema/credits";
import { getDashboardCredits } from "@/features/credits/server";
import { isIncomeTransactionType } from "@/features/credits/view";
import { getDashboardOverviewData } from "@/features/dashboard/server";
import type { OverviewCredits, OverviewPlan } from "@/features/dashboard/view";
import { getDashboardPlan } from "@/features/subscription/server";
import {
  cleanupTestUsers,
  createTestCreditsBalance,
  createTestUser,
  getUserCreditsState,
  testDb,
} from "../utils";

const credits: OverviewCredits = {
  balance: 20,
  totalEarned: 30,
  totalSpent: 10,
  transactions: [],
};
const plan: OverviewPlan = {
  planName: "Pro",
  hasActiveSubscription: true,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-12-01T00:00:00.000Z",
};

describe("dashboard optional providers", () => {
  it("does not create placeholder data for absent capabilities", async () => {
    await expect(getDashboardOverviewData("user-1")).resolves.toEqual({});
  });

  it("passes the authenticated user to only the selected providers", async () => {
    const loadCredits = vi.fn().mockResolvedValue(credits);
    const loadPlan = vi.fn().mockResolvedValue(plan);

    await expect(
      getDashboardOverviewData("user-1", { loadCredits })
    ).resolves.toEqual({ credits });
    expect(loadCredits).toHaveBeenCalledExactlyOnceWith("user-1");
    await expect(
      getDashboardOverviewData("user-2", { loadPlan })
    ).resolves.toEqual({ plan });
    expect(loadPlan).toHaveBeenCalledExactlyOnceWith("user-2");
    await expect(
      getDashboardOverviewData("user-3", { loadCredits, loadPlan })
    ).resolves.toEqual({ credits, plan });
  });

  it("propagates provider errors instead of presenting an empty successful overview", async () => {
    const error = new Error("balance unavailable");
    await expect(
      getDashboardOverviewData("user-1", {
        loadCredits: vi.fn().mockRejectedValue(error),
      })
    ).rejects.toBe(error);
  });
});

describe("credit transaction direction", () => {
  it.each([
    ["purchase", true],
    ["monthly_grant", true],
    ["registration_bonus", true],
    ["admin_grant", true],
    ["refund", true],
    ["consumption", false],
    ["expiration", false],
    ["unknown", false],
  ] as const)("classifies %s without depending on a skin", (type, expected) => {
    expect(isIncomeTransactionType(type)).toBe(expected);
  });
});

describe("dashboard database summaries", () => {
  const userIds: string[] = [];

  afterAll(async () => cleanupTestUsers(userIds));

  it("keeps overview reads free of registration-bonus side effects", async () => {
    const user = await createTestUser();
    userIds.push(user.id);
    const before = await getUserCreditsState(user.id);

    await expect(getDashboardCredits(user.id)).resolves.toEqual({
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
    });
    await expect(getDashboardPlan(user.id)).resolves.toMatchObject({
      planName: "Free",
      hasActiveSubscription: false,
      currentPeriodEnd: null,
    });
    await expect(getUserCreditsState(user.id)).resolves.toEqual(before);
  });

  it("returns six latest transactions for the requested user and plain view fields", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    userIds.push(user.id, other.id);
    await createTestCreditsBalance({
      userId: user.id,
      balance: 80,
      totalEarned: 100,
      totalSpent: 20,
    });
    await testDb.insert(creditsTransaction).values([
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `${user.id}-tx-${index}`,
        userId: user.id,
        type:
          index % 2 === 0 ? ("purchase" as const) : ("consumption" as const),
        amount: index + 1,
        debitAccount: "system",
        creditAccount: "user",
        description: null,
        createdAt: new Date(Date.UTC(2026, 0, index + 1)),
      })),
      {
        id: `${other.id}-tx`,
        userId: other.id,
        type: "purchase",
        amount: 999,
        debitAccount: "system",
        creditAccount: "user",
        createdAt: new Date("2026-12-31T00:00:00Z"),
      },
    ]);

    const data = await getDashboardCredits(user.id);

    expect(data).toMatchObject({
      balance: 80,
      totalEarned: 100,
      totalSpent: 20,
    });
    expect(data.transactions).toHaveLength(6);
    expect(data.transactions[0]).toEqual({
      id: `${user.id}-tx-7`,
      type: "consumption",
      description: null,
      amount: 8,
      isIncome: false,
      createdAt: "2026-01-08T00:00:00.000Z",
    });
    expect(data.transactions.at(-1)?.id).toBe(`${user.id}-tx-2`);
    expect(
      data.transactions.some((transaction) => transaction.amount === 999)
    ).toBe(false);
  });
});
