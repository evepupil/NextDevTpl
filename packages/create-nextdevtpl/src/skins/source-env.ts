import { GeneratorError } from "../generator-error.js";
import { failSkin, SkinValidationError } from "./errors.js";
import type {
  RemoteSkinSourceSelection,
  SkinSourceSelection,
} from "./source-types.js";

export const DEFAULT_SKIN_TOKEN_ENV = "NEXTDEVTPL_SKIN_TOKEN";

const ENVIRONMENT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;

export class SkinSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkinSourceError";
  }
}

function environmentKey(name: string): string {
  return process.platform === "win32" ? name.toLowerCase() : name;
}

function findEnvironmentValue(
  env: NodeJS.ProcessEnv,
  name: string
): string | undefined {
  if (process.platform !== "win32") return env[name];

  const normalizedName = environmentKey(name);
  const match = Object.entries(env).find(
    ([key]) => environmentKey(key) === normalizedName
  );
  return match?.[1];
}

function tokenEnvironmentNames(
  selection: SkinSourceSelection | undefined
): string[] {
  const names = [DEFAULT_SKIN_TOKEN_ENV];
  if (selection?.kind === "remote" && selection.tokenEnv) {
    names.push(selection.tokenEnv);
  }
  return names;
}

export function getRemoteSkinToken(
  selection: RemoteSkinSourceSelection,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  const explicitName = selection.tokenEnv;
  const name = explicitName ?? DEFAULT_SKIN_TOKEN_ENV;
  if (!ENVIRONMENT_NAME_PATTERN.test(name)) {
    failSkin(["Invalid skin token environment variable name"]);
  }

  const value = findEnvironmentValue(env, name);
  if (explicitName !== undefined && !value) {
    failSkin(["Configured skin token environment variable is missing"]);
  }
  return value || undefined;
}

export function skinProcessEnvironment(
  selection: SkinSourceSelection | undefined,
  env: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  const blocked = new Set(tokenEnvironmentNames(selection).map(environmentKey));
  const sanitized: NodeJS.ProcessEnv = { ...env };
  for (const name of Object.keys(sanitized)) {
    if (blocked.has(environmentKey(name))) delete sanitized[name];
  }
  return sanitized;
}

export function sanitizeSkinError(
  error: unknown,
  selection: SkinSourceSelection | undefined,
  env: NodeJS.ProcessEnv = process.env
): Error {
  let message =
    error instanceof SkinValidationError ||
    error instanceof SkinSourceError ||
    error instanceof GeneratorError
      ? error.message
      : "Skin source operation failed";
  const secretValues = new Set(
    tokenEnvironmentNames(selection)
      .map((name) => findEnvironmentValue(env, name))
      .filter((value): value is string => Boolean(value))
  );

  for (const secret of secretValues) {
    message = message.split(secret).join("[redacted]");
  }

  message = message
    .replace(
      /\b(?:authorization|proxy-authorization)\s*[:=]\s*[^\r\n]+/giu,
      "authorization: [redacted]"
    )
    .replace(/\bhttps?:\/\/[^\s"'<>]+/giu, "[redacted URL]");

  return new Error(message || "Skin source failed");
}
