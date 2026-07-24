import type {
  DeploymentTarget,
  PresetName,
} from "../../packages/create-nextdevtpl/src/types";
import exemptionsDocument from "./exemptions.json";
import matrixDocument from "./matrix.json";

export const COMPATIBILITY_STAGES = [
  "generate",
  "target-config",
  "deployment-config",
  "install",
  "migration",
  "lint",
  "typecheck",
  "test",
  "build",
  "health",
] as const;

export type CompatibilityStage = (typeof COMPATIBILITY_STAGES)[number];

export interface CompatibilityCase {
  buildScript: "build" | "cf:build";
  forbiddenPaths: readonly string[];
  healthCheck: boolean;
  id: string;
  preset: Exclude<PresetName, "custom">;
  requiredPaths: readonly string[];
  target: DeploymentTarget;
}

export interface CompatibilityExemption {
  caseId: string;
  expiresAt: string;
  issue: string;
  reason: string;
  stage: CompatibilityStage;
}

const deploymentTargets = new Set<DeploymentTarget>([
  "cloudflare",
  "docker",
  "server",
  "vercel",
]);
const presets = new Set<PresetName>(["ai-saas", "minimal", "saas"]);
const stages = new Set<string>(COMPATIBILITY_STAGES);

function assertStringArray(
  value: unknown,
  name: string
): asserts value is string[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error(`${name} must be a non-empty string array`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadCompatibilityMatrix(): readonly CompatibilityCase[] {
  if (matrixDocument.version !== 1 || !Array.isArray(matrixDocument.cases)) {
    throw new Error("Unsupported compatibility matrix document");
  }

  const ids = new Set<string>();
  return matrixDocument.cases.map((entry) => {
    if (!entry.id || ids.has(entry.id)) {
      throw new Error(`Duplicate or empty compatibility case: ${entry.id}`);
    }
    ids.add(entry.id);
    if (!presets.has(entry.preset as PresetName)) {
      throw new Error(`Unknown compatibility preset: ${entry.preset}`);
    }
    if (!deploymentTargets.has(entry.target as DeploymentTarget)) {
      throw new Error(`Unknown compatibility target: ${entry.target}`);
    }
    if (entry.buildScript !== "build" && entry.buildScript !== "cf:build") {
      throw new Error(`Unknown build script: ${entry.buildScript}`);
    }
    assertStringArray(entry.requiredPaths, `${entry.id}.requiredPaths`);
    if (!Array.isArray(entry.forbiddenPaths)) {
      throw new Error(`${entry.id}.forbiddenPaths must be an array`);
    }
    return entry as CompatibilityCase;
  });
}

export function loadCompatibilityExemptions(): readonly CompatibilityExemption[] {
  if (
    exemptionsDocument.version !== 1 ||
    !Array.isArray(exemptionsDocument.exemptions)
  ) {
    throw new Error("Unsupported compatibility exemptions document");
  }

  const caseIds = new Set(loadCompatibilityMatrix().map(({ id }) => id));
  const exemptions: readonly unknown[] = exemptionsDocument.exemptions;
  return exemptions.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Every compatibility exemption must be an object");
    }
    const caseId = entry.caseId;
    const stage = entry.stage;
    const reason = entry.reason;
    const issue = entry.issue;
    const expiresAt = entry.expiresAt;
    if (typeof caseId !== "string" || !caseIds.has(caseId)) {
      throw new Error(`Exemption references an unknown case: ${caseId}`);
    }
    if (typeof stage !== "string" || !stages.has(stage)) {
      throw new Error(`Exemption references an unknown stage: ${stage}`);
    }
    if (
      typeof reason !== "string" ||
      typeof issue !== "string" ||
      !reason.trim() ||
      !issue.trim()
    ) {
      throw new Error("Every compatibility exemption needs a reason and issue");
    }
    if (typeof expiresAt !== "string" || Number.isNaN(Date.parse(expiresAt))) {
      throw new Error(`Invalid exemption expiry: ${expiresAt}`);
    }
    return {
      caseId,
      stage: stage as CompatibilityStage,
      reason,
      issue,
      expiresAt,
    };
  });
}

export function findActiveExemption(
  caseId: string,
  stage: CompatibilityStage,
  now = new Date()
): CompatibilityExemption | undefined {
  return loadCompatibilityExemptions().find(
    (entry) =>
      entry.caseId === caseId &&
      entry.stage === stage &&
      Date.parse(entry.expiresAt) > now.getTime()
  );
}
