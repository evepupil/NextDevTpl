import { AdapterError, type MailAdapter } from "@/core/services";

export const disabledMailAdapter: MailAdapter = {
  provider: "disabled",
  capabilities: {
    attachments: false,
    batch: false,
    transactional: false,
  },
  async send() {
    throw new AdapterError({
      code: "configuration",
      message: "Mail delivery is disabled for this project",
      provider: "disabled",
    });
  },
};
