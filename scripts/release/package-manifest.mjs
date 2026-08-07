const REQUIRED_FILES = [
  "README.md",
  "README.en.md",
  "catalog.json",
  "dist/cli.js",
  "dist/index.js",
  "package.json",
  "template/manifest.json",
  "template/README.en.md",
  "template/package.json",
  "template/pnpm-lock.yaml",
  "template/src/middleware.ts",
];

const FORBIDDEN_PATTERNS = [
  /(^|\/)\.env($|\.(?!example$))/,
  /(^|\/)\.next(\/|$)/,
  /(^|\/)\.source(\/|$)/,
  /(^|\/)artifacts(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)src\/test(\/|$)/,
  /(^|\/)tsconfig\.tsbuildinfo$/,
  /^template\/(AGENTS|CLAUDE)\.md$/,
  /^template\/packages\/create-nextdevtpl(\/|$)/,
];

export function readRoadmapVersion(markdown) {
  const match = markdown.match(/^> 当前版本：`v([^`]+)`$/m);
  if (!match) throw new Error("roadmap current version is missing");
  return match[1];
}

export function validateReleasePackage({ files, packageJson, roadmap }) {
  const issues = [];
  const paths = new Set(files.map((file) => file.path));
  const roadmapVersion = readRoadmapVersion(roadmap);

  if (packageJson.name !== "create-nextdevtpl") {
    issues.push("package name must be create-nextdevtpl");
  }
  if (packageJson.version !== roadmapVersion) {
    issues.push(
      `package version ${packageJson.version} does not match roadmap ${roadmapVersion}`
    );
  }
  if (packageJson.private === true) {
    issues.push("release package must not be private");
  }
  if (packageJson.publishConfig?.access !== "public") {
    issues.push("release package must declare public access");
  }

  for (const path of REQUIRED_FILES) {
    if (!paths.has(path)) issues.push(`release package is missing ${path}`);
  }

  for (const path of paths) {
    if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(path))) {
      issues.push(`release package contains forbidden path ${path}`);
    }
  }

  if (issues.length > 0) throw new Error(issues.join("\n"));

  return {
    fileCount: files.length,
    name: packageJson.name,
    version: packageJson.version,
  };
}
