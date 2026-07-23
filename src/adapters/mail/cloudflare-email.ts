import { executeAdapterOperation, type MailAdapter } from "@/core/services";

interface CloudflareEmailBindingMessage {
  bcc?: readonly string[];
  cc?: readonly string[];
  from: string | { email: string; name?: string };
  html: string;
  replyTo?: string | readonly string[];
  subject: string;
  text: string;
  to: string | readonly string[];
}

export interface CloudflareEmailBindingPort {
  send(message: CloudflareEmailBindingMessage): Promise<{ messageId: string }>;
}

export function createCloudflareEmailAdapter(
  binding: CloudflareEmailBindingPort
): MailAdapter {
  const provider = "cloudflare-email" as const;

  return {
    provider,
    capabilities: {
      attachments: true,
      batch: false,
      transactional: true,
    },

    async send(message) {
      const result = await executeAdapterOperation({
        provider,
        fallbackMessage: "Cloudflare email delivery failed",
        operation: () =>
          binding.send({
            from: message.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.cc ? { cc: message.cc } : {}),
            ...(message.bcc ? { bcc: message.bcc } : {}),
            ...(message.replyTo ? { replyTo: message.replyTo } : {}),
          }),
      });
      return { id: result.messageId, queued: true };
    },
  };
}
