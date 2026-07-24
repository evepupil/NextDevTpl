import { describe, expect, it } from "vitest";

import {
  createResetPasswordEmail,
  createVerifyEmail,
} from "../../../cloudflare/templates/mail/templates";

describe("Cloudflare lightweight mail templates", () => {
  it("renders HTML and plain text without a runtime template engine", () => {
    const email = createResetPasswordEmail({
      name: "Ada",
      resetUrl: "https://example.com/reset?token=abc",
    });

    expect(email.html).toContain("Reset Your Password");
    expect(email.html).toContain("https://example.com/reset?token=abc");
    expect(email.text).toContain("Reset Password:");
  });

  it("escapes user-controlled values in HTML", () => {
    const email = createVerifyEmail({
      name: '<script>alert("x")</script>',
      verifyUrl: 'https://example.com/verify?a=1&next="bad"',
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
    expect(email.html).toContain("a=1&amp;next=&quot;bad&quot;");
  });
});
