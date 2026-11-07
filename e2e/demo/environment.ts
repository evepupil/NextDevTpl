export function demoEnvironment(): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = { NODE_ENV: "production" };
  const systemKeys = new Set([
    "APPDATA",
    "COMSPEC",
    "HOME",
    "HOMEDRIVE",
    "HOMEPATH",
    "LOCALAPPDATA",
    "PATH",
    "PATHEXT",
    "PROGRAMDATA",
    "PROGRAMFILES",
    "SYSTEMDRIVE",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "WINDIR",
  ]);
  for (const [key, value] of Object.entries(process.env)) {
    if (systemKeys.has(key.toUpperCase())) result[key] = value;
  }
  return {
    ...result,
    CI: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    NO_PROXY: "localhost,127.0.0.1,::1",
    TZ: "UTC",
  };
}
