import { logApiResponse, logError } from "@/lib/logger";
import { trackApiFailure, type FailureClass } from "@/lib/telemetry/failures";
import { getTelemetryContextFromRequest } from "@/lib/telemetry/identity";

// biome-ignore lint/suspicious/noExplicitAny: wrapper must accept both Request and NextRequest
type ApiHandler = (request: any, context?: any) => Promise<Response>;

export function withApiLogging<T extends ApiHandler>(handler: T): T {
  const wrapped = async (request: Request, context?: unknown) => {
    const startTime = Date.now();
    const path = new URL(request.url).pathname;
    const telemetryContext = getTelemetryContextFromRequest({
      headers: request.headers,
    });

    const trackResponseFailure = (statusCode: number): void => {
      if (statusCode < 400) return;

      const failureClass: FailureClass =
        statusCode === 401 || statusCode === 403
          ? "authorization"
          : statusCode === 429
            ? "rate_limited"
            : statusCode >= 500
              ? "exception"
              : "http";

      trackApiFailure({
        context: telemetryContext,
        durationMs: Date.now() - startTime,
        failureClass,
        method: request.method,
        path,
        statusCode,
      });
    };

    try {
      const response = await handler(request, context);
      logApiResponse(request, response, Date.now() - startTime);
      trackResponseFailure(response.status);
      return response;
    } catch (error) {
      logError(error, {
        source: "api",
        method: request.method,
        path,
        duration: Date.now() - startTime,
      });
      trackApiFailure({
        context: telemetryContext,
        durationMs: Date.now() - startTime,
        failureClass: "exception",
        method: request.method,
        path,
        statusCode: 500,
      });
      throw error;
    }
  };
  return wrapped as T;
}
