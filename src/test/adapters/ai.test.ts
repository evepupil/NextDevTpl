import { describe, expect, it } from "vitest";

import { createAnthropicAdapter } from "@/adapters/ai";

describe("Anthropic adapter", () => {
  it("separates system prompts and normalizes text responses", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const request: typeof globalThis.fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({
        model: "claude-test",
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: " world" },
        ],
      });
    };
    const adapter = createAnthropicAdapter({
      apiKey: "anthropic-key",
      model: "claude-test",
      fetch: request,
    });

    await expect(
      adapter.complete({
        messages: [
          { role: "system", content: "Be concise." },
          { role: "user", content: "Say hello." },
        ],
        maxTokens: 100,
      })
    ).resolves.toEqual({ content: "Hello world", model: "claude-test" });
    expect(requestBody).toMatchObject({
      system: "Be concise.",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello." }],
    });
  });

  it("rejects unsupported guaranteed JSON mode", async () => {
    const adapter = createAnthropicAdapter({
      apiKey: "anthropic-key",
      model: "claude-test",
    });

    await expect(
      adapter.complete({ messages: [], jsonMode: true })
    ).rejects.toMatchObject({ code: "unsupported", provider: "anthropic" });
  });
});
