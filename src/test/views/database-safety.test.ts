import { describe, expect, it } from "vitest";

import { assertSafeTestDatabase } from "../utils/database-safety";

describe("test database isolation", () => {
  it.each([
    "postgres://test:test@localhost:5432/app_test",
    "postgresql://test:test@127.0.0.1:15470/app_test",
    "postgresql://test:test@[::1]:5432/app_test",
  ])("allows an explicit local connection: %s", (url) => {
    expect(() => assertSafeTestDatabase(url, false)).not.toThrow();
  });

  it.each([
    "postgresql://test:test@remote.example/app_test",
    "postgresql://test:test@localhost.example/app_test",
    "postgresql://localhost:password@remote.example/app_test",
    "postgresql://test:test@remote.example/localhost",
  ])("rejects a nonlocal database by default: %s", (url) => {
    expect(() => assertSafeTestDatabase(url, false)).toThrow();
  });

  it("requires an explicit opt-in for a valid remote PostgreSQL connection", () => {
    expect(() =>
      assertSafeTestDatabase(
        "postgresql://test:test@remote.example/app_test",
        true
      )
    ).not.toThrow();
  });

  it.each([
    "not-a-url",
    "https://localhost/app_test",
    "mysql://localhost/app_test",
    "postgresql:/app_test",
  ])("rejects malformed or unsupported URLs even with remote access enabled: %s", (url) =>
    expect(() => assertSafeTestDatabase(url, true)).toThrow());

  it("does not disclose database credentials in an error", () => {
    const url =
      "postgresql://private-user:private-password@remote.example/private-db";
    let message = "";
    try {
      assertSafeTestDatabase(url, false);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).not.toBe("");
    expect(message).not.toContain("private-user");
    expect(message).not.toContain("private-password");
    expect(message).not.toContain(url);
  });
});
