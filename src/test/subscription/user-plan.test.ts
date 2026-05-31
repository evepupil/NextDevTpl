/**
 * 用户订阅计划服务测试
 *
 * 测试范围：
 * - 无订阅用户返回 free 计划
 * - 有活跃订阅的用户正确返回计划信息
 * - 已取消订阅的用户行为
 * - 文件大小特权检查
 */

import { afterAll, describe, expect, it } from "vitest";
import {
  checkFileSizePrivilege,
  getUserPlan,
  getUserPlanType,
} from "@/features/subscription/services/user-plan";
import {
  cleanupTestUsers,
  createTestSubscription,
  createTestUser,
} from "../utils";

const createdUserIds: string[] = [];

afterAll(async () => {
  await cleanupTestUsers(createdUserIds);
});

describe("getUserPlan", () => {
  it("无订阅用户应返回 free 计划", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const plan = await getUserPlan(testUser.id);

    expect(plan.plan).toBe("free");
    expect(plan.planName).toBe("Free");
    expect(plan.hasActiveSubscription).toBe(false);
    expect(plan.subscriptionStatus).toBeNull();
    expect(plan.cancelAtPeriodEnd).toBe(false);
  });

  it("活跃订阅用户应返回正确的计划信息", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    await createTestSubscription({
      userId: testUser.id,
      status: "active",
      priceId: "price_test_active",
    });

    const plan = await getUserPlan(testUser.id);

    expect(plan.hasActiveSubscription).toBe(true);
    expect(plan.subscriptionStatus).toBe("active");
    expect(plan.priceId).toBe("price_test_active");
    expect(plan.currentPeriodEnd).not.toBeNull();
  });

  it("trialing 状态应视为活跃", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    await createTestSubscription({
      userId: testUser.id,
      status: "trialing",
    });

    const plan = await getUserPlan(testUser.id);

    expect(plan.hasActiveSubscription).toBe(true);
    expect(plan.subscriptionStatus).toBe("trialing");
  });

  it("已取消但未到期的订阅应视为活跃", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await createTestSubscription({
      userId: testUser.id,
      status: "canceled",
      currentPeriodEnd: futureDate,
    });

    const plan = await getUserPlan(testUser.id);

    expect(plan.hasActiveSubscription).toBe(true);
    expect(plan.subscriptionStatus).toBe("canceled");
  });

  it("已过期取消的订阅应返回 free", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await createTestSubscription({
      userId: testUser.id,
      status: "canceled",
      currentPeriodEnd: pastDate,
    });

    const plan = await getUserPlan(testUser.id);

    expect(plan.plan).toBe("free");
    expect(plan.hasActiveSubscription).toBe(false);
  });

  it("paused 状态不应视为活跃", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    await createTestSubscription({
      userId: testUser.id,
      status: "paused",
    });

    const plan = await getUserPlan(testUser.id);

    expect(plan.hasActiveSubscription).toBe(false);
  });
});

describe("getUserPlanType", () => {
  it("应返回计划类型", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const planType = await getUserPlanType(testUser.id);

    expect(planType).toBe("free");
  });
});

describe("checkFileSizePrivilege", () => {
  it("Free 计划应允许 5MB 以内的文件", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const result = await checkFileSizePrivilege(
      testUser.id,
      3 * 1024 * 1024
    );

    expect(result.allowed).toBe(true);
  });

  it("Free 计划应拒绝超过 5MB 的文件", async () => {
    const testUser = await createTestUser();
    createdUserIds.push(testUser.id);

    const result = await checkFileSizePrivilege(
      testUser.id,
      10 * 1024 * 1024
    );

    expect(result.allowed).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.upgradeMessage).toBeDefined();
  });
});
