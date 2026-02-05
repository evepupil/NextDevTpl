import { createHmac, timingSafeEqual } from "crypto";

const CREEM_API_BASE_URL =
  process.env.CREEM_API_BASE_URL ??
  (process.env.CREEM_TEST_MODE === "true" || process.env.NODE_ENV !== "production"
    ? "https://test-api.creem.io"
    : "https://api.creem.io");

function getCreemApiKey(): string {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    throw new Error("CREEM_API_KEY 未配置");
  }
  return apiKey;
}

async function creemRequest<TResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<TResponse> {
  const apiKey = getCreemApiKey();
  const response = await fetch(`${CREEM_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Creem API 请求失败: ${response.status} ${errorText}`);
  }

  return (await response.json()) as TResponse;
}

export async function createCreemCheckout(params: {
  productId: string;
  requestId: string;
  successUrl?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, string>;
}): Promise<{ checkoutUrl: string; checkoutId?: string }> {
  const payload: Record<string, unknown> = {
    product_id: params.productId,
    request_id: params.requestId,
  };

  if (params.successUrl) {
    payload.success_url = params.successUrl;
  }

  if (params.customer) {
    payload.customer = params.customer;
  }

  if (params.metadata) {
    payload.metadata = params.metadata;
  }

  const response = await creemRequest<{
    id?: string;
    checkout_url: string;
  }>("/v1/checkouts", payload);

  if (response.id) {
    return {
      checkoutUrl: response.checkout_url,
      checkoutId: response.id,
    };
  }

  return {
    checkoutUrl: response.checkout_url,
  };
}

export async function createCreemCustomerPortal(params: {
  customerId: string;
}): Promise<{ url: string }> {
  const response = await creemRequest<{
    customer_portal_link: string;
  }>("/v1/customers/billing", {
    customer_id: params.customerId,
  });

  return { url: response.customer_portal_link };
}

export function verifyCreemSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const normalizedSignature = signature.replace(/\s+/g, "").toLowerCase();
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (normalizedSignature.length !== expectedSignature.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(normalizedSignature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}
