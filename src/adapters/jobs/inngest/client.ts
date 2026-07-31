import { Inngest } from "inngest";
import { getRuntimeEnv } from "@/lib/runtime-config";

const eventKey = getRuntimeEnv("INNGEST_EVENT_KEY");

export const inngest = new Inngest({
  id: "saas-template",
  ...(eventKey ? { eventKey } : {}),
});
