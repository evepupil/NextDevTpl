import { describe, expect, it } from "vitest";

import {
  createAnthropicAdapter,
  createOpenAICompatibleAdapter,
} from "@/adapters/ai";

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
    ).resolves.toMatchObject({
      content: "Hello world",
      model: "claude-test",
      provider: "anthropic",
      usage: {
        inputTokens: null,
        outputTokens: null,
        status: "unavailable",
        totalTokens: null,
      },
    });
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

describe("OpenAI-compatible AI adapter", () => {
  it("normalizes provider usage and latency", async () => {
    const adapter = createOpenAICompatibleAdapter({
      apiKey: "openai-key",
      model: "gpt-4o-mini",
      baseURL: "https://ai.example/v1",
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json({
        choices: [{ message: { content: "Hello" } }],
        model: "gpt-4o-mini",
        usage: {
          completion_tokens: 4,
          prompt_tokens: 6,
          total_tokens: 10,
        },
      });
    try {
      await expect(
        adapter.complete({ messages: [{ role: "user", content: "Hello" }] })
      ).resolves.toMatchObject({
        provider: "openai-compatible",
        usage: {
          inputTokens: 6,
          outputTokens: 4,
          status: "actual",
          totalTokens: 10,
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
