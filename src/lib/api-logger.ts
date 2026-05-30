import { logApiResponse, logError } from "@/lib/logger";

// biome-ignore lint/suspicious/noExplicitAny: wrapper must accept both Request and NextRequest
type ApiHandler = (request: any, context?: any) => Promise<Response>;

export function withApiLogging<T extends ApiHandler>(handler: T): T {
  const wrapped = async (request: Request, context?: unknown) => {
    const startTime = Date.now();
    try {
      const response = await handler(request, context);
      logApiResponse(request, response, Date.now() - startTime);
      return response;
    } catch (error) {
      logError(error, {
        source: "api",
        method: request.method,
        path: new URL(request.url).pathname,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  };
  return wrapped as T;
}