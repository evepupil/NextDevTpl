import { createResendMailAdapter } from "@/adapters/mail";

export const mailService = createResendMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
