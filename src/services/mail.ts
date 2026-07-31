import { createResendMailAdapter } from "@/adapters/mail";
import { getRuntimeEnv } from "@/lib/runtime-config";

export const mailService = createResendMailAdapter();

export function isMailServiceConfigured(): boolean {
  return Boolean(getRuntimeEnv("RESEND_API_KEY"));
}
