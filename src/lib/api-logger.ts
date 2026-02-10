import { logApiResponse, logError } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
