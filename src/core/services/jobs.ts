import type { AdapterDescriptor, JsonObject } from "./common";

export type JobProvider = "cloudflare-workflows" | "inngest";

export interface JobCapabilities {
  durableSteps: boolean;
  events: boolean;
  scheduling: boolean;
}

export interface DispatchJobInput {
  id?: string;
  name: string;
  payload: JsonObject;
}

export interface DispatchJobResult {
  id: string;
}

export interface JobAdapter
  extends AdapterDescriptor<JobProvider, JobCapabilities> {
  dispatch(input: DispatchJobInput): Promise<DispatchJobResult>;
}
