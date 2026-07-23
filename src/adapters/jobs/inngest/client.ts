import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "saas-template",
  ...(process.env.INNGEST_EVENT_KEY
    ? { eventKey: process.env.INNGEST_EVENT_KEY }
    : {}),
});
