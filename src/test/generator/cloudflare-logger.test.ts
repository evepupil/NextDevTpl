import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createContextLogger,
  logApiResponse,
} from "../../../cloudflare/templates/logger";

describe("Cloudflare logger template", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes structured child context through console", () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => {});

    createContextLogger({ requestId: "request-1" }).info(
      { status: 200 },
      "completed"
    );

    expect(output).toHaveBeenCalledWith(
      "completed",
      expect.objectContaining({
        requestId: "request-1",
        service: "nextdevtpl",
        status: 200,
      })
    );
  });

  it("uses error output for failed API responses", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = new Request("https://example.com/api/health");
    const response = new Response(null, { status: 503 });

    logApiResponse(request, response, 12);

    expect(output).toHaveBeenCalledWith(
      "GET /api/health 503 12ms",
      expect.objectContaining({
        duration: 12,
        path: "/api/health",
        status: 503,
      })
    );
  });
});
