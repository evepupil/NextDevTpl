const target = process.argv[2] ?? process.env.HEALTHCHECK_URL;

if (!target) {
  throw new Error(
    "Health URL is required: pnpm deploy:check -- https://example.com/api/health"
  );
}

const response = await fetch(target, {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(10_000),
});
const report = await response.json();

if (!response.ok || report?.status !== "healthy") {
  throw new Error(`Health check failed with HTTP ${response.status}`);
}

process.stdout.write(
  `${JSON.stringify({
    status: report.status,
    version: report.version,
    timestamp: report.timestamp,
  })}\n`
);
