/**
 * 订阅计划配置测试
 *
 * 测试范围：
 * - 计划特权获取
 * - 文件大小限制检查
 * - 文件大小格式化
 * - 升级建议
 */

import { describe, expect, it } from "vitest";

import {
  formatFileSizeLimit,
  getPlanPrivileges,
  getUpgradeMessage,
  isWithinFileSizeLimit,
} from "@/config/subscription-plan";

describe("getPlanPrivileges", () => {
  it("应返回 Free 计划的特权", () => {
    const p = getPlanPrivileges("free");
    expect(p.name).toBe("Free");
    expect(p.maxFileSizeBytes).toBe(5 * 1024 * 1024);
    expect(p.monthlyCredits).toBe(200);
  });

  it("应返回 Starter 计划的特权", () => {
    const p = getPlanPrivileges("starter");
    expect(p.name).toBe("Starter");
    expect(p.maxFileSizeBytes).toBe(20 * 1024 * 1024);
  });

  it("应返回 Pro 计划的特权", () => {
    const p = getPlanPrivileges("pro");
    expect(p.name).toBe("Pro");
    expect(p.maxFileSizeBytes).toBe(50 * 1024 * 1024);
  });

  it("应返回 Ultra 计划的特权", () => {
    const p = getPlanPrivileges("ultra");
    expect(p.name).toBe("Ultra");
    expect(p.maxFileSizeBytes).toBe(100 * 1024 * 1024);
  });
});

describe("isWithinFileSizeLimit", () => {
  it("Free 计划：3MB 应在限制内", () => {
    expect(isWithinFileSizeLimit("free", 3 * 1024 * 1024)).toBe(true);
  });

  it("Free 计划：10MB 应超出限制", () => {
    expect(isWithinFileSizeLimit("free", 10 * 1024 * 1024)).toBe(false);
  });

  it("Starter 计划：15MB 应在限制内", () => {
    expect(isWithinFileSizeLimit("starter", 15 * 1024 * 1024)).toBe(true);
  });

  it("Starter 计划：25MB 应超出限制", () => {
    expect(isWithinFileSizeLimit("starter", 25 * 1024 * 1024)).toBe(false);
  });

  it("Pro 计划：45MB 应在限制内", () => {
    expect(isWithinFileSizeLimit("pro", 45 * 1024 * 1024)).toBe(true);
  });
});

describe("formatFileSizeLimit", () => {
  it("Free 计划限制应显示 5MB", () => {
    expect(formatFileSizeLimit("free")).toBe("5MB");
  });

  it("Starter 计划限制应显示 20MB", () => {
    expect(formatFileSizeLimit("starter")).toBe("20MB");
  });

  it("Pro 计划限制应显示 50MB", () => {
    expect(formatFileSizeLimit("pro")).toBe("50MB");
  });

  it("Ultra 计划限制应显示 100MB", () => {
    expect(formatFileSizeLimit("ultra")).toBe("100MB");
  });
});

describe("getUpgradeMessage", () => {
  it("Free 用户升级建议应指向 Starter", () => {
    const msg = getUpgradeMessage("free", "Files over 5MB");
    expect(msg).toContain("Starter");
    expect(msg).toContain("Files over 5MB");
  });

  it("Starter 用户升级建议应指向 Pro", () => {
    const msg = getUpgradeMessage("starter", "Files over 20MB");
    expect(msg).toContain("Pro");
  });

  it("Pro 用户升级建议应指向 Ultra", () => {
    const msg = getUpgradeMessage("pro", "Files over 50MB");
    expect(msg).toContain("Ultra");
  });
});
