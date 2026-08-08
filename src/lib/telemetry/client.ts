import type { JsonObject } from "@/core/services";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";
import { getClientTelemetryHeaders } from "./identity";

export interface ClientTelemetryEvent {
  attributes?: JsonObject;
  name: string;
  version: number;
}

export function trackClientEvent(input: ClientTelemetryEvent): void {
  if (!hasAnalyticsConsent()) return;

  try {
    const body = JSON.stringify(input);
    void fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...getClientTelemetryHeaders(),
      },
      body,
      keepalive: true,
    }).catch(() => {
      // 分析请求失败不能影响页面交互。
    });
  } catch {
    // 浏览器存储或序列化异常时静默降级。
  }
}

export function trackPageView(pathname: string): void {
  const path = pathname.trim().slice(0, 256) || "/";
  trackClientEvent({
    attributes: { path },
    name:
      path === "/" || /^\/[^/]+\/$/u.test(path)
        ? "landing.viewed"
        : "page.viewed",
    version: 1,
  });
}
