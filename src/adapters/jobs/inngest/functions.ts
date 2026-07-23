import { logger } from "@/lib/logger";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", retries: 3 },
  { event: "app/hello-world" },
  async ({ event, step }) =>
    step.run("process-message", async () => {
      const message =
        typeof event.data.message === "string" ? event.data.message : "";
      logger.info({ message }, "处理 hello-world 事件");
      return { processed: true, message };
    })
);

export const functions = [helloWorld];
