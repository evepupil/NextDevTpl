import nodemailer, { type Transporter } from "nodemailer";

import {
  AdapterError,
  executeAdapterOperation,
  type MailAdapter,
} from "@/core/services";

interface SmtpConfig {
  host?: string;
  pass?: string;
  port?: number;
  secure?: boolean;
  user?: string;
}

export function createSmtpMailAdapter(config: SmtpConfig = {}): MailAdapter {
  const provider = "smtp" as const;
  let transporter: Transporter | undefined;

  function getTransporter(): Transporter {
    if (transporter) {
      return transporter;
    }
    const host = config.host ?? process.env.SMTP_HOST;
    const port = config.port ?? Number(process.env.SMTP_PORT ?? 587);
    const user = config.user ?? process.env.SMTP_USER;
    const pass = config.pass ?? process.env.SMTP_PASS;
    const secure = config.secure ?? process.env.SMTP_SECURE === "true";

    if (!host || !Number.isInteger(port) || port <= 0) {
      throw new AdapterError({
        code: "configuration",
        message: "SMTP host and port are not configured",
        provider,
      });
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
    return transporter;
  }

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
        fallbackMessage: "SMTP delivery failed",
        secrets: [config.pass ?? process.env.SMTP_PASS],
        operation: () =>
          getTransporter().sendMail({
            from: message.from.name
              ? { address: message.from.email, name: message.from.name }
              : message.from.email,
            to: [...message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.cc ? { cc: [...message.cc] } : {}),
            ...(message.bcc ? { bcc: [...message.bcc] } : {}),
            ...(message.replyTo ? { replyTo: [...message.replyTo] } : {}),
          }),
      });

      return {
        ...(result.messageId ? { id: result.messageId } : {}),
        queued: true,
      };
    },
  };
}
