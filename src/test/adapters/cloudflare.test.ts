import { describe, expect, it } from "vitest";

import { createWorkersAIAdapter } from "@/adapters/ai";
import { createCloudflareWorkflowsAdapter } from "@/adapters/jobs";
import { createCloudflareEmailAdapter } from "@/adapters/mail";
import {
  createCloudflareRateLimitAdapter,
  noopRateLimitAdapter,
} from "@/adapters/rate-limit";
import { createR2BindingStorageAdapter } from "@/adapters/storage";

describe("Cloudflare storage adapter", () => {
  it("reads, writes and deletes through an R2 binding", async () => {
    const calls: string[] = [];
    const adapter = createR2BindingStorageAdapter({
      uploads: {
        async put(key, body, options) {
          calls.push(
            `put:${key}:${String(body)}:${options?.httpMetadata?.contentType}`
          );
        },
        async get(key) {
          calls.push(`get:${key}`);
          return {
            etag: "etag-1",
            httpMetadata: { contentType: "text/plain" },
            async arrayBuffer() {
              return new TextEncoder().encode("hello").buffer;
            },
          };
        },
        async delete(key) {
          calls.push(`delete:${key}`);
        },
      },
    });

    await adapter.writeObject({
      bucket: "uploads",
      key: "file.txt",
      body: "hello",
      contentType: "text/plain",
    });
    const object = await adapter.readObject("uploads", "file.txt");
    await adapter.deleteObject("uploads", "file.txt");

    expect(new TextDecoder().decode(object?.body)).toBe("hello");
    expect(object).toMatchObject({ contentType: "text/plain", etag: "etag-1" });
    expect(calls).toEqual([
      "put:file.txt:hello:text/plain",
      "get:file.txt",
      "delete:file.txt",
    ]);
  });

  it("reports signed URLs as unsupported", async () => {
    const adapter = createR2BindingStorageAdapter({});

    await expect(
      adapter.createUploadUrl({
        bucket: "uploads",
        key: "file.txt",
        contentType: "text/plain",
        expiresIn: 60,
      })
    ).rejects.toMatchObject({
      code: "unsupported",
      provider: "r2-binding",
    });
  });
});

describe("Cloudflare service bindings", () => {
  it("sends both HTML and plain text through Email Service", async () => {
    let sent: unknown;
    const adapter = createCloudflareEmailAdapter({
      async send(message) {
        sent = message;
        return { messageId: "message_1" };
      },
    });

    await expect(
      adapter.send({
        from: { email: "noreply@example.com", name: "Example" },
        to: ["user@example.com"],
        subject: "Welcome",
        html: "<h1>Welcome</h1>",
        text: "Welcome",
        replyTo: ["support@example.com"],
      })
    ).resolves.toEqual({ id: "message_1", queued: true });
    expect(sent).toMatchObject({
      from: { email: "noreply@example.com", name: "Example" },
      html: "<h1>Welcome</h1>",
      text: "Welcome",
      replyTo: ["support@example.com"],
    });
  });

  it("runs Workers AI with the selected model", async () => {
    let request: { model: string; input: Record<string, unknown> } | undefined;
    const adapter = createWorkersAIAdapter({
      model: "@cf/test/model",
      binding: {
        async run(model, input) {
          request = { model, input };
          return { response: "generated text" };
        },
      },
    });

    await expect(
      adapter.complete({
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.2,
      })
    ).resolves.toEqual({
      content: "generated text",
      model: "@cf/test/model",
    });
    expect(request).toMatchObject({
      model: "@cf/test/model",
      input: { temperature: 0.2 },
    });
  });

  it("dispatches named Workflow instances", async () => {
    let request: { id?: string; params: object } | undefined;
    const adapter = createCloudflareWorkflowsAdapter({
      generate: {
        async create(input) {
          request = input;
          return { id: input.id ?? "generated-id" };
        },
      },
    });

    await expect(
      adapter.dispatch({
        id: "job_1",
        name: "generate",
        payload: { userId: "user_1" },
      })
    ).resolves.toEqual({ id: "job_1" });
    expect(request).toEqual({ id: "job_1", params: { userId: "user_1" } });
  });

  it("returns honest metadata for Cloudflare and noop rate limits", async () => {
    const adapter = createCloudflareRateLimitAdapter({
      api: {
        async limit() {
          return { success: false };
        },
      },
    });
    const input = {
      identifier: "user_1",
      namespace: "api",
      limit: 10,
      window: "1m" as const,
    };

    await expect(adapter.limit(input)).resolves.toEqual({
      success: false,
      remaining: null,
      reset: null,
      limit: 10,
      skipped: false,
    });
    await expect(noopRateLimitAdapter.limit(input)).resolves.toEqual({
      success: true,
      remaining: null,
      reset: null,
      limit: null,
      skipped: true,
    });
  });
});
