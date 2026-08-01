import type { AdapterDescriptor } from "./common";

export type AlertProvider = "email" | "noop" | "webhook";
export type AlertSeverity = "critical" | "info" | "warning";

export interface AlertMessage {
  dedupeKey: string;
  message: string;
  occurredAt: Date;
  ruleKey: string;
  severity: AlertSeverity;
  source: string;
  threshold: number;
  title: string;
  value: number;
}

export interface AlertDeliveryResult {
  id?: string;
  queued: boolean;
}

export interface AlertCapabilities {
  email: boolean;
  signedWebhook: boolean;
}

export interface AlertAdapter
  extends AdapterDescriptor<AlertProvider, AlertCapabilities> {
  notify(message: AlertMessage): Promise<AlertDeliveryResult>;
}

export function createAlertService(adapter: AlertAdapter) {
  return {
    adapter,
    async notify(message: AlertMessage): Promise<AlertDeliveryResult> {
      try {
        return await adapter.notify(message);
      } catch {
        return { queued: false };
      }
    },
  };
}
