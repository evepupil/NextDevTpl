import type { SkinSourceSelection } from "../../packages/create-nextdevtpl/src/skins/source-types";
import type {
  DeploymentTarget,
  GenerationMode,
  PresetName,
  ServiceKind,
} from "../../packages/create-nextdevtpl/src/types";
import exemptionsDocument from "./exemptions.json";
import matrixSource from "./matrix.json";

const matrixDocument: unknown = matrixSource;

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
  adapterOverrides?: Readonly<Partial<Record<ServiceKind, string>>>;
  adapters?: Readonly<Partial<Record<ServiceKind, string>>>;
  buildScript: "build" | "cf:build";
  expectedPreset?: PresetName;
  expectedSkinId?: string;
  forbiddenPaths: readonly string[];
  forbiddenEnv?: readonly string[];
  healthCheck: boolean;
  id: string;
  modules?: readonly string[];
  mode?: GenerationMode;
  palette?: string;
  preset?: PresetName;
  requiredPaths: readonly string[];
  requiredEnv?: readonly string[];
  skin?: SkinSourceSelection;
  target: DeploymentTarget;
}

export interface CompatibilityExemption {
  caseId: string;
  expiresAt: string;
  issue: string;
  reason: string;
  stage: CompatibilityStage;
}

const presets = ["ai-saas", "custom", "minimal", "saas"] as const;
const serviceKinds = [
  "ai",
  "alerts",
  "analytics",
  "jobs",
  "mail",
  "payment",
  "rate-limit",
  "storage",
] as const satisfies readonly ServiceKind[];
const stages = new Set<string>(COMPATIBILITY_STAGES);
const compatibilityCaseIdPattern = /^[a-z][a-z0-9-]*$/u;

function isDeploymentTarget(value: unknown): value is DeploymentTarget {
  return (
    typeof value === "string" &&
    ["cloudflare", "docker", "server", "vercel"].some(
      (target) => target === value
    )
  );
}

function isPresetName(value: unknown): value is PresetName {
  return (
    typeof value === "string" && presets.some((preset) => preset === value)
  );
}

function isGenerationMode(value: unknown): value is GenerationMode {
  return value === "demo" || value === "full";
}

function isServiceKind(value: string): value is ServiceKind {
  return serviceKinds.some((service) => service === value);
}

function parseSkinSource(value: unknown, name: string): SkinSourceSelection {
  if (!isRecord(value) || typeof value.kind !== "string") {
    throw new Error(`${name} must be a skin source`);
  }

  if (value.kind === "builtin") {
    if (typeof value.id !== "string" || !value.id) {
      throw new Error(`${name}.id must be a non-empty string`);
    }
    return { kind: "builtin", id: value.id };
  }
  if (value.kind === "local") {
    if (typeof value.directory !== "string" || !value.directory) {
      throw new Error(`${name}.directory must be a non-empty string`);
    }
    return { kind: "local", directory: value.directory };
  }
  if (value.kind === "remote") {
    if (
      typeof value.url !== "string" ||
      !value.url ||
      typeof value.sha256 !== "string" ||
      !value.sha256 ||
      (value.tokenEnv !== undefined && typeof value.tokenEnv !== "string")
    ) {
      throw new Error(`${name}.remote needs a URL and SHA-256`);
    }
    return {
      kind: "remote",
      url: value.url,
      sha256: value.sha256,
      ...(typeof value.tokenEnv === "string"
        ? { tokenEnv: value.tokenEnv }
        : {}),
    };
  }
  throw new Error(`${name} skin source is unknown`);
}

function parseAdapterMap(
  value: unknown,
  name: string
): Partial<Record<ServiceKind, string>> | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error(`${name} must be an object`);

  const result: Partial<Record<ServiceKind, string>> = {};
  for (const [service, adapter] of Object.entries(value)) {
    if (!isServiceKind(service) || typeof adapter !== "string" || !adapter) {
      throw new Error(`${name} contains an invalid service adapter`);
    }
    result[service] = adapter;
  }
  return result;
}

function assertStringArray(
  value: unknown,
  name: string
): asserts value is string[] {
  if (
    !isStringList(value) ||
    value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new Error(`${name} must be a non-empty string array`);
  }
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadCompatibilityMatrix(
  document: unknown = matrixDocument
): readonly CompatibilityCase[] {
  if (
    !isRecord(document) ||
    document.version !== 1 ||
    !Array.isArray(document.cases)
  ) {
    throw new Error("Unsupported compatibility matrix document");
  }

  const ids = new Set<string>();
  const entries: readonly unknown[] = document.cases;
  return entries.map((value) => {
    if (!isRecord(value)) throw new Error("Invalid compatibility case");
    const entry = value;
    if (
      typeof entry.id !== "string" ||
      !compatibilityCaseIdPattern.test(entry.id)
    ) {
      throw new Error(`Invalid compatibility case ID: ${entry.id}`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate compatibility case ID: ${entry.id}`);
    }
    ids.add(entry.id);
    const modeValue = entry.mode;
    const mode = modeValue ?? "full";
    if (!isGenerationMode(mode)) {
      throw new Error(`Unknown compatibility mode: ${entry.mode}`);
    }
    if (entry.preset !== undefined && !isPresetName(entry.preset)) {
      throw new Error(`Unknown compatibility preset: ${entry.preset}`);
    }
    if (
      entry.expectedPreset !== undefined &&
      !isPresetName(entry.expectedPreset)
    ) {
      throw new Error(
        `Unknown expected compatibility preset: ${entry.expectedPreset}`
      );
    }
    if (
      entry.expectedSkinId !== undefined &&
      (typeof entry.expectedSkinId !== "string" || !entry.expectedSkinId)
    ) {
      throw new Error(`${entry.id}.expectedSkinId must be a non-empty string`);
    }
    if (!isDeploymentTarget(entry.target)) {
      throw new Error(`Unknown compatibility target: ${entry.target}`);
    }
    if (entry.buildScript !== "build" && entry.buildScript !== "cf:build") {
      throw new Error(`Unknown build script: ${entry.buildScript}`);
    }
    assertStringArray(entry.requiredPaths, `${entry.id}.requiredPaths`);
    if (!isStringList(entry.forbiddenPaths)) {
      throw new Error(`${entry.id}.forbiddenPaths must be a string array`);
    }
    if (typeof entry.healthCheck !== "boolean") {
      throw new Error(`${entry.id}.healthCheck must be a boolean`);
    }
    if (entry.modules !== undefined) {
      assertStringArray(entry.modules, `${entry.id}.modules`);
    }
    if (entry.palette !== undefined && typeof entry.palette !== "string") {
      throw new Error(`${entry.id}.palette must be a string`);
    }
    const skin =
      entry.skin === undefined
        ? undefined
        : parseSkinSource(entry.skin, `${entry.id}.skin`);
    const adapterOverrides = parseAdapterMap(
      entry.adapterOverrides,
      `${entry.id}.adapterOverrides`
    );
    const adapters = parseAdapterMap(entry.adapters, `${entry.id}.adapters`);
    if (mode === "demo") {
      if (
        entry.preset !== undefined ||
        entry.modules !== undefined ||
        adapterOverrides
      ) {
        throw new Error(`${entry.id}.demo cannot select backend features`);
      }
      if (entry.target !== "server" || entry.healthCheck !== false) {
        throw new Error(
          `${entry.id}.demo requires server without health checks`
        );
      }
      if (entry.expectedPreset !== "custom") {
        throw new Error(`${entry.id}.demo must expect preset custom`);
      }
      if (
        entry.palette !== undefined &&
        skin !== undefined &&
        (skin.kind !== "builtin" || skin.id !== "default")
      ) {
        throw new Error(
          `${entry.id}.palette requires the built-in default skin`
        );
      }
    } else if (!entry.preset) {
      throw new Error(`${entry.id}.full requires a preset`);
    }
    const requiredEnv = entry.requiredEnv;
    if (requiredEnv !== undefined) {
      assertStringArray(requiredEnv, `${entry.id}.requiredEnv`);
    }
    const forbiddenEnv = entry.forbiddenEnv;
    if (forbiddenEnv !== undefined) {
      assertStringArray(forbiddenEnv, `${entry.id}.forbiddenEnv`);
    }
    return {
      id: entry.id,
      buildScript: entry.buildScript,
      forbiddenPaths: entry.forbiddenPaths,
      healthCheck: entry.healthCheck,
      requiredPaths: entry.requiredPaths,
      target: entry.target,
      ...(adapters ? { adapters } : {}),
      ...(adapterOverrides ? { adapterOverrides } : {}),
      ...(entry.expectedPreset !== undefined
        ? { expectedPreset: entry.expectedPreset }
        : {}),
      ...(entry.expectedSkinId !== undefined
        ? { expectedSkinId: entry.expectedSkinId }
        : {}),
      ...(entry.modules !== undefined ? { modules: entry.modules } : {}),
      ...(modeValue !== undefined ? { mode } : {}),
      ...(entry.palette !== undefined ? { palette: entry.palette } : {}),
      ...(entry.preset !== undefined ? { preset: entry.preset } : {}),
      ...(requiredEnv !== undefined ? { requiredEnv } : {}),
      ...(skin ? { skin } : {}),
      ...(forbiddenEnv !== undefined ? { forbiddenEnv } : {}),
    };
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
