import type { AdapterDescriptor } from "./common";

export type MailProvider = "cloudflare-email" | "disabled" | "resend" | "smtp";

export interface MailCapabilities {
  attachments: boolean;
  batch: boolean;
  transactional: boolean;
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailMessage {
  bcc?: readonly string[];
  cc?: readonly string[];
  from: MailAddress;
  html: string;
  replyTo?: readonly string[];
  subject: string;
  text: string;
  to: readonly string[];
}

export interface MailSendResult {
  id?: string;
  queued: boolean;
}

export interface MailAdapter
  extends AdapterDescriptor<MailProvider, MailCapabilities> {
  send(message: MailMessage): Promise<MailSendResult>;
}
