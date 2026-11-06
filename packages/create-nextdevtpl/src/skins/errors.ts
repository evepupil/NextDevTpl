export class SkinValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Skin package validation failed: ${issues.join("; ")}`);
    this.name = "SkinValidationError";
    this.issues = issues;
  }
}

export function failSkin(issues: readonly string[]): never {
  throw new SkinValidationError(issues);
}
