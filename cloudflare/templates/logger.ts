type LogData = Record<string, unknown>;
type LogLevel = "debug" | "error" | "fatal" | "info" | "warn";
type ConsoleMethod = "debug" | "error" | "log" | "warn";

export interface Logger {
  child(context: LogData): Logger;
  debug(dataOrMessage: LogData | string, message?: string): void;
  error(dataOrMessage: LogData | string, message?: string): void;
  fatal(dataOrMessage: LogData | string, message?: string): void;
  info(dataOrMessage: LogData | string, message?: string): void;
  warn(dataOrMessage: LogData | string, message?: string): void;
}

const CONSOLE_METHODS: Readonly<Record<LogLevel, ConsoleMethod>> = {
  debug: "debug",
  error: "error",
  fatal: "error",
  info: "log",
  warn: "warn",
};

function writeLog(
  level: LogLevel,
  context: LogData,
  dataOrMessage: LogData | string,
  message?: string
): void {
  const data =
    typeof dataOrMessage === "string"
      ? context
      : { ...context, ...dataOrMessage };
  const text = typeof dataOrMessage === "string" ? dataOrMessage : message;
  const details = Object.keys(data).length > 0 ? data : undefined;
  const output = console[CONSOLE_METHODS[level]];

  if (text && details) {
    output(text, details);
    return;
  }
  if (text) {
    output(text);
    return;
  }
  if (details) output(details);
}

function createLogger(context: LogData = {}): Logger {
  return {
    child(childContext) {
      return createLogger({ ...context, ...childContext });
    },
    debug(dataOrMessage, message) {
      writeLog("debug", context, dataOrMessage, message);
    },
    error(dataOrMessage, message) {
      writeLog("error", context, dataOrMessage, message);
    },
    fatal(dataOrMessage, message) {
      writeLog("fatal", context, dataOrMessage, message);
    },
    info(dataOrMessage, message) {
      writeLog("info", context, dataOrMessage, message);
    },
    warn(dataOrMessage, message) {
      writeLog("warn", context, dataOrMessage, message);
    },
  };
}

export const logger = createLogger({
  env: process.env.NODE_ENV,
  service: "nextdevtpl",
});

export function createContextLogger(context: LogData): Logger {
  return logger.child(context);
}

export function createRequestLogger(request: Request): Logger {
  const url = new URL(request.url);
  return logger.child({
    requestId: crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get("user-agent")?.slice(0, 100),
  });
}

export type BusinessEvent =
  | "user.signup"
  | "user.login"
  | "user.logout"
  | "payment.checkout.started"
  | "payment.checkout.completed"
  | "payment.credits.already_granted"
  | "payment.credits.grant_success"
  | "payment.subscription.created"
  | "payment.subscription.canceled"
  | "payment.subscription.past_due"
  | "payment.subscription.paused"
  | "payment.subscription.upserted"
  | "credits.purchased"
  | "credits.consumed"
  | "credits.expired"
  | "ticket.created"
  | "ticket.replied"
  | "ticket.closed"
  | "email.sent"
  | "file.uploaded"
  | "file.deleted"
  | "admin.user.banned"
  | "admin.user.unbanned";

export function logEvent(event: BusinessEvent, data?: LogData): void {
  logger.info({ event, ...data }, `Event: ${event}`);
}

export function logError(error: unknown, context?: LogData): void {
  if (error instanceof Error) {
    logger.error(
      {
        err: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
      error.message
    );
    return;
  }
  logger.error({ err: error, ...context }, "Unknown error");
}

export function logWarn(message: string, data?: LogData): void {
  logger.warn(data ?? {}, message);
}

export function logDebug(message: string, data?: LogData): void {
  logger.debug(data ?? {}, message);
}

export function logApiResponse(
  request: Request,
  response: Response,
  duration: number
): void {
  const url = new URL(request.url);
  const level =
    response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info";

  logger[level](
    {
      method: request.method,
      path: url.pathname,
      status: response.status,
      duration,
    },
    `${request.method} ${url.pathname} ${response.status} ${duration}ms`
  );
}
