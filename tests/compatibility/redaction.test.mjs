import { describe, expect, it } from "vitest";

import {
  redact,
  toWslPath,
} from "../../scripts/compatibility/process.mjs";

describe("compatibility log redaction", () => {
  it("removes sensitive environment values from command output", () => {
    const output = [
      "DATABASE_URL=postgresql://private-database",
      "API_KEY=private-api-key",
      "PUBLIC_LABEL=visible-label",
    ].join("\n");

    expect(
      redact(output, {
        DATABASE_URL: "postgresql://private-database",
        API_KEY: "private-api-key",
        PUBLIC_LABEL: "visible-label",
      })
    ).toBe(
      [
        "DATABASE_URL=[REDACTED]",
        "API_KEY=[REDACTED]",
        "PUBLIC_LABEL=visible-label",
      ].join("\n")
    );
  });

  it("maps the Windows compatibility workspace into WSL", () => {
    expect(toWslPath("C:\\Temp\\nextdevtpl\\saas-docker")).toBe(
      "/mnt/c/Temp/nextdevtpl/saas-docker"
    );
  });
});
