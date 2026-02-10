/**
 * 支付系统类型定义
 *
 * 定义支付相关的所有类型、枚举和接口
 */

// ============================================
// 支付类型枚举
// ============================================

/**
 * 支付类型
 */
export enum PaymentType {
  /** 订阅支付（周期性） */
  SUBSCRIPTION = "subscription",
  /** 一次性支付 */
  ONE_TIME = "one-time",
}

/**
 * 计划周期
 */
export enum PlanInterval {
  /** 月付 */
  MONTH = "monthly",
  /** 年付 */
  YEAR = "yearly",
}

/**
 * 订阅状态
 */
export enum SubscriptionStatus {
  /** 活跃 */
  ACTIVE = "active",
  /** 试用中 */
  TRIALING = "trialing",
  /** 已取消 */
  CANCELED = "canceled",
  /** 未完成 */
  INCOMPLETE = "incomplete",
  /** 未完成且已过期 */
  INCOMPLETE_EXPIRED = "incomplete_expired",
  /** 逾期未付 */
  PAST_DUE = "past_due",
  /** 已暂停 */
  PAUSED = "paused",
  /** 未支付 */
  UNPAID = "unpaid",
}

// ============================================
// 价格和计划接口
// ============================================

/**
 * 价格配置
 */
export interface PriceConfig {
  /** 支付类型 */
  type: PaymentType;
  /** 价格 ID（来自 Creem） */
  priceId: string;
  /** 金额 */
  amount: number;
  /** 周期（仅订阅类型需要） */
  interval?: PlanInterval;
  /** 试用期天数（可选） */
  trialPeriodDays?: number;
}

/**
 * 计划配置
 */
export interface PlanConfig {
  /** 计划唯一标识 */
  id: string;
  /** 是否为免费计划 */
  isFree?: boolean;
  /** 是否为终身计划 */
  isLifetime?: boolean;
  /** 是否为企业计划 */
  isEnterprise?: boolean;
  /** 是否为热门/推荐计划 */
  popular?: boolean;
  /** 是否高亮显示 */
  highlighted?: boolean;
  /** 价格列表 */
  prices?: PriceConfig[];
}

/**
 * 计划显示信息（用于定价页面）
 */
export interface PlanDisplayInfo {
  /** 计划名称 */
  name: string;
  /** 计划描述 */
  description: string;
  /** 功能列表 */
  features: string[];
  /** CTA 按钮文本 */
  cta: string;
  /** 是否使用深色主题 */
  dark?: boolean;
}

/**
 * 完整计划信息（配置 + 显示信息）
 */
export interface Plan extends PlanConfig, PlanDisplayInfo {}

// ============================================
// 支付配置接口
// ============================================

/**
 * 支付系统配置
 */
export interface PaymentConfig {
  /** 支付提供商 */
  provider: "stripe" | "creem";
  /** 货币 */
  currency: string;
  /** 年付折扣百分比 */
  yearlyDiscount: number;
  /** 支付完成后重定向 URL */
  redirectAfterCheckout: string;
  /** 取消支付后重定向 URL */
  redirectAfterCancel: string;
  /** 计划配置 */
  plans: {
    free?: PlanConfig;
    starter?: PlanConfig;
    pro?: PlanConfig;
    ultra?: PlanConfig;
  };
}

/**
 * 定价页面配置
 */
export interface PricingConfig {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 周期选项文本 */
  frequencies: [string, string];
  /** 年付折扣百分比 */
  yearlyDiscount: number;
  /** 计划列表 */
  plans: Plan[];
}

// ============================================
// Server Action 参数接口
// ============================================

/**
 * 创建 Checkout Session 参数
 */
export interface CreateCheckoutParams {
  /** 价格 ID */
  priceId: string;
  /** 支付类型 */
  type?: PaymentType;
  /** 试用期天数 */
  trialPeriodDays?: number;
  /** 成功回调 URL */
  successUrl?: string;
  /** 取消回调 URL */
  cancelUrl?: string;
}

/**
 * 创建 Customer Portal 参数
 */
export interface CreatePortalParams {
  /** 返回 URL */
  returnUrl?: string;
}

// ============================================
// Webhook 事件数据接口
// ============================================

/**
 * 订阅数据
 */
export interface SubscriptionData {
  id: string;
  status: string;
  priceId: string;
  customerId: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}
