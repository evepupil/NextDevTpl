import { describe, expect, it } from "vitest";

import { redactError, redactRecord, redactText } from "@/lib/redaction";

describe("redaction", () => {
  it("removes sensitive fields recursively", () => {
    expect(
      redactRecord({
        email: "user@example.com",
        nested: {
          authorization: "Bearer secret",
          safe: "value",
        },
        items: [{ token: "secret", value: "kept" }],
      })
    ).toEqual({
      nested: { safe: "value" },
      items: [{ value: "kept" }],
    });
  });

  it("redacts secrets embedded in text and errors", () => {
    const message =
      "Bearer abc123 https://user:password@example.com?token=secret user@example.com";
    expect(redactText(message)).toBe(
      "Bearer [REDACTED] https://[REDACTED]@example.com?token=[REDACTED] [REDACTED_EMAIL]"
    );
    expect(redactError(new Error(message))).toMatchObject({
      message:
        "Bearer [REDACTED] https://[REDACTED]@example.com?token=[REDACTED] [REDACTED_EMAIL]",
    });
  });
});
