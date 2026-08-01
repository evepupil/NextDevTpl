import type { TelemetryAdapter } from "@/core/services";

export const noopTelemetryAdapter: TelemetryAdapter = {
  provider: "noop",
  capabilities: {
    clientEvents: false,
    identityLinking: false,
    query: false,
    serverEvents: true,
  },
  async track() {
    // 未配置分析服务时保持业务流程可用且不产生外部请求。
  },
};
