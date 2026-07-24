import type { MailAddress } from "@/core/services";
import { mailService } from "@/services/mail";

import type { RenderedEmail } from "./templates";

export const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM ?? "NextDevTpl <noreply@example.com>";

export interface SendEmailParams {
  bcc?: string | string[];
  cc?: string | string[];
  content: RenderedEmail;
  force?: boolean;
  from?: string;
  replyTo?: string | string[];
  subject: string;
  to: string | string[];
}

export interface SendEmailResult {
  error?: string;
  id?: string;
  simulated?: boolean;
  success: boolean;
}

function parseMailAddress(value: string): MailAddress {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  const email = match?.[2];
  const name = match?.[1]?.trim();

  if (!email) return { email: value.trim() };
  return name ? { email, name } : { email };
}

function toArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  if (process.env.NODE_ENV === "development" && !params.force) {
    console.log("Email preview", {
      from: params.from ?? DEFAULT_FROM_EMAIL,
      subject: params.subject,
      to: params.to,
    });
    return { simulated: true, success: true };
  }

  try {
    const result = await mailService.send({
      from: parseMailAddress(params.from ?? DEFAULT_FROM_EMAIL),
      to: toArray(params.to),
      subject: params.subject,
      html: params.content.html,
      text: params.content.text,
      ...(params.cc ? { cc: toArray(params.cc) } : {}),
      ...(params.bcc ? { bcc: toArray(params.bcc) } : {}),
      ...(params.replyTo ? { replyTo: toArray(params.replyTo) } : {}),
    });
    return { success: true, ...(result.id ? { id: result.id } : {}) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", message);
    return { error: message, success: false };
  }
}
