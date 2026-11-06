const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

function normalizeHostname(hostname: string): string {
  const normalized = hostname.toLowerCase();
  return normalized.startsWith("[") && normalized.endsWith("]")
    ? normalized.slice(1, -1)
    : normalized;
}

export function assertSafeTestDatabase(
  databaseUrl: string,
  allowRemote: boolean
): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("Test DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!POSTGRES_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(
      "Test DATABASE_URL must use postgres or postgresql protocol."
    );
  }

  const hostname = normalizeHostname(parsedUrl.hostname);
  if (!hostname) {
    throw new Error("Test DATABASE_URL must include a database host.");
  }

  if (allowRemote) return;

  if (
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1"
  ) {
    throw new Error(
      "Test database must use a local loopback host unless remote access is explicitly enabled."
    );
  }
}
