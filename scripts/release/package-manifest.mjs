const REQUIRED_FILES = [
  "README.md",
  "README.en.md",
  "catalog.json",
  "dist/cli.js",
  "dist/index.js",
  "package.json",
  "palettes/licenses/stylekit-MIT.txt",
  "palettes/stylekit/LICENSE",
  "palettes/stylekit/normalized/glassmorphism.json",
  "palettes/stylekit/registry.json",
  "palettes/stylekit/snapshot.json",
  "palettes/stylekit/themes/glassmorphism.json",
  "template/manifest.json",
  "template/README.md",
  "template/README.en.md",
  "template/package.json",
  "template/pnpm-lock.yaml",
  "template/src/core/skin/demo/index.ts",
  "template/src/core/skin/demo/schema.ts",
  "template/src/core/skin/version.json",
  "template/src/middleware.ts",
  "template/src/modules/app-runtime.tsx",
  "template/src/modules/demo-skin-views.ts",
  "template/src/modules/view-pages.tsx",
  "template/src/skin/skin.json",
  "template/src/skin/tokens.css",
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

export function validateReleasePackage({
  files,
  packageJson,
  roadmap,
  requiredRuntimeFiles = [],
}) {
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

  for (const path of new Set([...REQUIRED_FILES, ...requiredRuntimeFiles])) {
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
