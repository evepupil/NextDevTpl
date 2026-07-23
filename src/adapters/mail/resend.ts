import { Resend } from "resend";

import {
  AdapterError,
  executeAdapterOperation,
  type MailAdapter,
  type MailMessage,
} from "@/core/services";

interface ResendConfig {
  apiKey?: string;
}

function formatAddress(address: MailMessage["from"]): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

export function createResendMailAdapter(
  config: ResendConfig = {}
): MailAdapter {
  const provider = "resend" as const;
  let client: Resend | undefined;

  function getClient(): Resend {
    if (client) {
      return client;
    }
    const apiKey = config.apiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new AdapterError({
        code: "configuration",
        message: "RESEND_API_KEY is not configured",
        provider,
      });
    }
    client = new Resend(apiKey);
    return client;
  }

  return {
    provider,
    capabilities: {
      attachments: true,
      batch: true,
      transactional: true,
    },

    async send(message) {
      const { data, error } = await executeAdapterOperation({
        provider,
        fallbackMessage: "Resend delivery failed",
        secrets: [config.apiKey ?? process.env.RESEND_API_KEY],
        operation: () =>
          getClient().emails.send({
            from: formatAddress(message.from),
            to: [...message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.cc ? { cc: [...message.cc] } : {}),
            ...(message.bcc ? { bcc: [...message.bcc] } : {}),
            ...(message.replyTo ? { replyTo: [...message.replyTo] } : {}),
          }),
      });

      if (error) {
        throw new AdapterError({
          code: "remote_failure",
          message: error.message,
          provider,
        });
      }
      return { ...(data?.id ? { id: data.id } : {}), queued: true };
    },
  };
}
