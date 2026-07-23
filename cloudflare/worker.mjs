import { WorkflowEntrypoint } from "cloudflare:workers";

import nextWorker from "../.open-next/worker.js";

export class NextDevTplWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    return step.do(
      "complete-job",
      {
        retries: {
          delay: "5 seconds",
          limit: 3,
        },
        timeout: "1 minute",
      },
      async () => ({
        id: event.instanceId,
        payload: event.payload,
        status: "completed",
      })
    );
  }
}

export default nextWorker;
