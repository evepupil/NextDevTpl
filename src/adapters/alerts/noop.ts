import type { AlertAdapter } from "@/core/services";

export const noopAlertAdapter: AlertAdapter = {
  provider: "noop",
  capabilities: { email: false, signedWebhook: false },
  async notify() {
    return { queued: false };
  },
};
