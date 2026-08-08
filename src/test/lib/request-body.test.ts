import { describe, expect, it } from "vitest";

import { readRequestBody, RequestBodyTooLargeError } from "@/lib/request-body";

describe("bounded request body reader", () => {
  it("reads a body within the byte limit", async () => {
    const body = await readRequestBody(
      new Request("https://app.example.test/api/telemetry", {
        body: '{"ok":true}',
        method: "POST",
      }),
      128
    );

    expect(body).toBe('{"ok":true}');
  });

  it("rejects an oversized declared body before reading it", async () => {
    const request = new Request("https://app.example.test/api/telemetry", {
      body: "small",
      headers: { "content-length": "129" },
      method: "POST",
    });

    await expect(readRequestBody(request, 128)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("rejects an oversized streamed body", async () => {
    const requestInit = {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("1234"));
          controller.enqueue(new TextEncoder().encode("5678"));
          controller.close();
        },
      }),
      duplex: "half" as const,
      method: "POST",
    } as RequestInit & { duplex: "half" };
    const request = new Request("https://app.example.test/api/telemetry", {
      ...requestInit,
    });

    await expect(readRequestBody(request, 7)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });
});
