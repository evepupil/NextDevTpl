import type { OperationsDashboard } from "../types";

export type AlertRuleOperator = "above" | "below";

export interface OperationsAlertRule {
  cooldownMinutes: number;
  key: string;
  message: string;
  operator: AlertRuleOperator;
  recoveryThreshold: number;
  requiredConsecutive: number;
  severity: "critical" | "warning";
  source: string;
  threshold: number;
  title: string;
  value: (dashboard: OperationsDashboard) => number | null;
}

export function getOperationsAlertRules(
  options: {
    aiCostThresholdMinor?: number;
    cooldownMinutes?: number;
    paymentFailureRateThreshold?: number;
  } = {}
): OperationsAlertRule[] {
  const cooldownMinutes = options.cooldownMinutes ?? 30;
  const paymentFailureRateThreshold = options.paymentFailureRateThreshold ?? 20;
  return [
    {
      cooldownMinutes,
      key: "payment_failure_rate",
      message: "周期内支付失败比例超过阈值，请检查支付供应商和 Webhook。",
      operator: "above",
      recoveryThreshold: Math.max(0, paymentFailureRateThreshold / 2),
      requiredConsecutive: 2,
      severity: "critical",
      source: "database:revenue-event",
      threshold: paymentFailureRateThreshold,
      title: "支付失败率升高",
      value: (dashboard) => {
        const failures = dashboard.revenue.paymentFailures.value;
        const successes = dashboard.revenue.confirmedRevenueEvents.value;
        if (
          failures === null ||
          successes === null ||
          dashboard.revenue.paymentFailures.status === "zero-data" ||
          dashboard.revenue.confirmedRevenueEvents.status === "zero-data"
        ) {
          return null;
        }
        const total = failures + successes;
        return total > 0 ? (failures / total) * 100 : null;
      },
    },
    {
      cooldownMinutes,
      key: "ai_cost_threshold",
      message: "周期 AI 成本超过配置阈值，请检查模型用量和价格配置。",
      operator: "above",
      recoveryThreshold: Math.max(
        0,
        (options.aiCostThresholdMinor ?? 10_00) * 0.8
      ),
      requiredConsecutive: 1,
      severity: "warning",
      source: "database:ai-usage-event",
      threshold: options.aiCostThresholdMinor ?? 10_00,
      title: "AI 成本超过阈值",
      value: (dashboard) => dashboard.ai.costMinor.value,
    },
    {
      cooldownMinutes,
      key: "paid_conversion_rate",
      message: "周期付费转化率低于阈值，请检查注册到付费链路。",
      operator: "below",
      recoveryThreshold: 5,
      requiredConsecutive: 2,
      severity: "warning",
      source: "database:revenue-event+auth",
      threshold: 2,
      title: "付费转化率下降",
      value: (dashboard) => dashboard.revenue.paidConversionRate.value,
    },
  ];
}

export function isRuleBreached(
  rule: OperationsAlertRule,
  value: number
): boolean {
  return rule.operator === "above"
    ? value >= rule.threshold
    : value <= rule.threshold;
}

export function isRuleRecovered(
  rule: OperationsAlertRule,
  value: number
): boolean {
  return rule.operator === "above"
    ? value <= rule.recoveryThreshold
    : value >= rule.recoveryThreshold;
}
