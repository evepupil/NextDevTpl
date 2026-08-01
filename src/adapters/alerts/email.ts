import type { AlertAdapter, MailAdapter } from "@/core/services";

export interface EmailAlertConfig {
  from: string;
  mail: MailAdapter;
  to: readonly string[];
}

export function createEmailAlertAdapter(
  config: EmailAlertConfig
): AlertAdapter {
  return {
    provider: "email",
    capabilities: { email: true, signedWebhook: false },
    async notify(message) {
      const result = await config.mail.send({
        from: parseAddress(config.from),
        html: `<h2>${escapeHtml(message.title)}</h2><p>${escapeHtml(message.message)}</p><p>当前值：${message.value}，阈值：${message.threshold}</p>`,
        subject: `[${message.severity}] ${message.title}`,
        text: `${message.title}\n${message.message}\n当前值：${message.value}，阈值：${message.threshold}`,
        to: config.to,
      });
      return {
        ...(result.id ? { id: result.id } : {}),
        queued: result.queued,
      };
    },
  };
}

function parseAddress(value: string) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return match?.[2]
    ? { email: match[2], ...(match[1] ? { name: match[1].trim() } : {}) }
    : { email: value.trim() };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character
  );
}
