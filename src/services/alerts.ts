import {
  createEmailAlertAdapter,
  createWebhookAlertAdapter,
  noopAlertAdapter,
} from "@/adapters/alerts";
import { createAlertService } from "@/core/services";
import { getRuntimeEnv } from "@/lib/runtime-config";
import { mailService } from "@/services/mail";

function createConfiguredAlertAdapter() {
  switch (getRuntimeEnv("ALERT_PROVIDER")) {
    case "email": {
      const to = getRuntimeEnv("ALERT_EMAIL_TO")
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const from = getRuntimeEnv("EMAIL_FROM");
      if (!to?.length || !from) return noopAlertAdapter;
      return createEmailAlertAdapter({ from, mail: mailService, to });
    }
    case "webhook": {
      const url = getRuntimeEnv("ALERT_WEBHOOK_URL");
      if (!url) return noopAlertAdapter;
      const secret = getRuntimeEnv("ALERT_WEBHOOK_SECRET");
      return createWebhookAlertAdapter({ ...(secret ? { secret } : {}), url });
    }
    default:
      return noopAlertAdapter;
  }
}

export const alertService = createAlertService(createConfiguredAlertAdapter());
