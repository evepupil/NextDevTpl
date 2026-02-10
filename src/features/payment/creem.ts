/**
 * Creem API 客户端
 *
 * 提供与 Creem 支付平台的 API 交互
 * 文档: https://docs.creem.io/api-reference
 */

import crypto from "crypto";

const CREEM_API_BASE = process.env.CREEM_API_KEY?.startsWith("creem_test_")
  ? "https://test-api.creem.io/v1"
  : "https://api.creem.io/v1";

// ============================================
// 类型定义
// ============================================

export interface CreemCheckoutParams {
  /** Creem 产品 ID */
  product_id: string;
  /** 支付成功后的重定向 URL */
  success_url: string;
  /** 请求 ID（用于幂等性） */
  request_id?: string;
  /** 自定义元数据 */
  metadata?: Record<string, string>;
}

export interface CreemCheckoutResponse {
  /** Checkout ID */
  id: string;
  /** Checkout URL（重定向用户到此 URL 完成支付） */
  checkout_url: string;
  /** 状态 */
  status: string;
}

export interface CreemSubscription {
  /** 订阅 ID */
  id: string;
  /** 订阅状态 */
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  /** 产品（可能是 ID 字符串或完整对象） */
  product: string | { id: string; name?: string; price?: number; currency?: string; billing_type?: string; billing_period?: string };
  /** 客户（可能是 ID 字符串或完整对象） */
  customer: string | { id: string; email?: string; name?: string };
  /** 当前周期开始时间 (ISO 8601) */
  current_period_start_date: string;
  /** 当前周期结束时间 (ISO 8601) */
  current_period_end_date: string;
  /** 是否在周期结束时取消 */
  cancel_at_period_end: boolean;
  /** 元数据 */
  metadata?: Record<string, string>;
}

export interface CreemCustomer {
  /** 客户 ID */
  id: string;
  /** 邮箱 */
  email: string;
  /** 名称 */
  name?: string;
  /** 元数据 */
  metadata?: Record<string, string>;
}

export interface CreemWebhookEvent {
  /** 事件 ID */
  id: string;
  /** 事件类型 (Creem 使用 eventType 驼峰命名) */
  eventType:
    | "checkout.completed"
    | "subscription.active"
    | "subscription.canceled"
    | "subscription.renewed"
    | "subscription.paused"
    | "subscription.past_due"
    | "subscription.paid"
    | "subscription.expired";
  /** 事件数据 (Creem 直接在顶层使用 object，不嵌套在 data 里) */
  object: CreemCheckoutCompletedData | CreemSubscription;
  /** 创建时间 (Unix 毫秒时间戳) */
  created_at: number;
}

export interface CreemCheckoutCompletedData {
  /** Checkout ID */
  id: string;
  /** Checkout 对象类型 */
  object: "checkout";
  /** 请求 ID（幂等性） */
  request_id?: string;
  /** 订单信息 */
  order?: {
    object: "order";
    id: string;
    customer: string;
    product: string;
    amount: number;
    currency: string;
    status: string;
    type: "onetime" | "subscription";
    transaction?: string;
  };
  /** 产品信息 */
  product?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billing_type: "onetime" | "recurring";
    billing_period: string;
  };
  /** 订阅信息（如果是订阅支付） */
  subscription?: CreemSubscription;
  /** 客户信息 */
  customer: CreemCustomer;
  /** Checkout 状态 */
  status: string;
  /** 元数据 */
  metadata?: Record<string, string>;
  /** 模式 */
  mode?: "test" | "live";
}

// ============================================
// API 客户端
// ============================================

/**
 * Creem API 客户端
 */
export const creem = {
  /**
   * 创建 Checkout Session
   *
   * @param params - Checkout 参数
   * @returns Checkout 响应（包含重定向 URL）
   */
  async createCheckout(params: CreemCheckoutParams): Promise<CreemCheckoutResponse> {
    const res = await fetch(`${CREEM_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CREEM_API_KEY ?? "",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Creem API error: ${res.status} - ${error}`);
    }

    return res.json();
  },

  /**
   * 获取订阅详情
   *
   * @param subscriptionId - 订阅 ID
   * @returns 订阅信息
   */
  async getSubscription(subscriptionId: string): Promise<CreemSubscription> {
    const res = await fetch(`${CREEM_API_BASE}/subscriptions/${subscriptionId}`, {
      headers: {
        "x-api-key": process.env.CREEM_API_KEY ?? "",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Creem API error: ${res.status} - ${error}`);
    }

    return res.json();
  },

  /**
   * 取消订阅
   *
   * @param subscriptionId - 订阅 ID
   * @returns 更新后的订阅信息
   */
  async cancelSubscription(subscriptionId: string): Promise<CreemSubscription> {
    const res = await fetch(`${CREEM_API_BASE}/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.CREEM_API_KEY ?? "",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Creem API error: ${res.status} - ${error}`);
    }

    return res.json();
  },

  /**
   * 获取客户信息
   *
   * @param customerId - 客户 ID
   * @returns 客户信息
   */
  async getCustomer(customerId: string): Promise<CreemCustomer> {
    const res = await fetch(`${CREEM_API_BASE}/customers/${customerId}`, {
      headers: {
        "x-api-key": process.env.CREEM_API_KEY ?? "",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Creem API error: ${res.status} - ${error}`);
    }

    return res.json();
  },
};

// ============================================
// Webhook 签名验证
// ============================================

/**
 * 验证 Creem Webhook 签名
 *
 * @param payload - 原始请求体
 * @param signature - creem-signature 头
 * @param secret - Webhook 密钥
 * @returns 是否验证通过
 */
export function verifyCreemWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 解析并验证 Creem Webhook 事件
 *
 * @param payload - 原始请求体
 * @param signature - creem-signature 头
 * @returns 解析后的事件对象
 * @throws 如果签名验证失败
 */
export function constructCreemEvent(
  payload: string,
  signature: string
): CreemWebhookEvent {
  const secret = process.env.CREEM_WEBHOOK_SECRET ?? "";

  if (!verifyCreemWebhookSignature(payload, signature, secret)) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(payload) as CreemWebhookEvent;
}
