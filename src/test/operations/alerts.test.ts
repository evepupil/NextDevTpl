import { describe, expect, it } from "vitest";

import {
  createEmailAlertAdapter,
  createWebhookAlertAdapter,
} from "@/adapters/alerts";
import {
  evaluateAlertState,
  getOperationsAlertRules,
  isRuleRecovered,
} from "@/features/operations";

const message = {
  dedupeKey: "payment_failure_rate:UTC",
  message: "支付失败比例过高",
  occurredAt: new Date("2026-08-02T00:00:00.000Z"),
  ruleKey: "payment_failure_rate",
  severity: "critical" as const,
  source: "test",
  threshold: 20,
  title: "支付失败率升高",
  value: 25,
};

describe("operations alert state", () => {
  it("requires consecutive breaches and respects cooldown", () => {
    const first = evaluateAlertState({
      cooldownMinutes: 30,
      cooldownUntil: null,
      isBreached: true,
      now: message.occurredAt,
      previousConsecutiveCount: 0,
      previousStatus: null,
      requiredConsecutive: 2,
    });
    expect(first.shouldNotify).toBe(false);
    expect(first.status).toBe("firing");

    const second = evaluateAlertState({
      cooldownMinutes: 30,
      cooldownUntil: null,
      isBreached: true,
      now: new Date("2026-08-02T00:01:00.000Z"),
      previousConsecutiveCount: first.nextConsecutiveCount,
      previousStatus: first.status,
      requiredConsecutive: 2,
    });
    expect(second.shouldNotify).toBe(true);

    const cooled = evaluateAlertState({
      cooldownMinutes: 30,
      cooldownUntil: second.cooldownUntil,
      isBreached: true,
      now: new Date("2026-08-02T00:02:00.000Z"),
      previousConsecutiveCount: second.nextConsecutiveCount,
      previousStatus: second.status,
      requiredConsecutive: 2,
    });
    expect(cooled.shouldNotify).toBe(false);
  });

  it("emits a recovery transition when a firing rule clears", () => {
    const result = evaluateAlertState({
      cooldownMinutes: 30,
      cooldownUntil: new Date("2026-08-02T00:30:00.000Z"),
      isBreached: false,
      now: new Date("2026-08-02T00:03:00.000Z"),
      previousConsecutiveCount: 3,
      previousStatus: "firing",
      requiredConsecutive: 2,
    });
    expect(result.shouldResolve).toBe(true);
    expect(result.status).toBe("resolved");
    expect(result.cooldownUntil).toBeNull();
  });

  it("keeps an alert firing until its recovery threshold is reached", () => {
    const result = evaluateAlertState({
      cooldownMinutes: 30,
      cooldownUntil: new Date("2026-08-02T00:30:00.000Z"),
      isBreached: false,
      isRecovered: false,
      now: new Date("2026-08-02T00:03:00.000Z"),
      previousConsecutiveCount: 2,
      previousStatus: "firing",
      requiredConsecutive: 2,
    });
    expect(result.shouldResolve).toBe(false);
    expect(result.status).toBe("firing");
    expect(result.nextConsecutiveCount).toBe(2);
  });
});

describe("alert rule recovery thresholds", () => {
  it("uses hysteresis for payment failure recovery", () => {
    const rule = getOperationsAlertRules({
      paymentFailureRateThreshold: 20,
    }).find((item) => item.key === "payment_failure_rate");
    expect(rule).toBeDefined();
    if (!rule) return;
    expect(isRuleRecovered(rule, 15)).toBe(false);
    expect(isRuleRecovered(rule, 10)).toBe(true);
  });
});

describe("alert adapters", () => {
  it("sends a signed webhook without leaking the secret into the payload", async () => {
    let requestBody = "";
    let signature = "";
    const adapter = createWebhookAlertAdapter({
      fetch: async (_input, init) => {
        requestBody = String(init?.body);
        signature =
          new Headers(init?.headers).get("X-NextDevTpl-Signature") ?? "";
        return Response.json({ ok: true });
      },
      secret: "secret-value",
      url: "https://hooks.example.test/alerts",
    });
    await expect(adapter.notify(message)).resolves.toEqual({ queued: true });
    expect(requestBody).not.toContain("secret-value");
    expect(signature).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("maps a mail adapter result to the alert contract", async () => {
    let subject = "";
    const adapter = createEmailAlertAdapter({
      from: "Ops <ops@example.com>",
      mail: {
        provider: "disabled",
        capabilities: { attachments: false, batch: false, transactional: true },
        send: async (mail) => {
          subject = mail.subject;
          return { id: "mail_1", queued: true };
        },
      },
      to: ["owner@example.com"],
    });
    await expect(adapter.notify(message)).resolves.toEqual({
      id: "mail_1",
      queued: true,
    });
    expect(subject).toContain("支付失败率升高");
  });
});
