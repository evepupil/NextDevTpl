import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, parseEnv } from "node:util";

import { VISUAL_BASE_URL, VISUAL_DATABASE_URL } from "../e2e/visual/constants.ts";
import { VISUAL_AUTH_SECRET } from "../e2e/visual/fixtures.ts";
import { generateProject, loadCatalog } from "../packages/create-nextdevtpl/dist/index.js";
import { applyPaletteToTokensCss, loadPaletteSnapshot } from "../packages/create-nextdevtpl/dist/palettes/index.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotDirectory = join(repositoryRoot, "packages/create-nextdevtpl/palettes/stylekit");
const { values } = parseArgs({
  options: { keep: { type: "boolean", default: false }, case: { type: "string" } },
});
const keep = values.keep;
const projectCases = [
  { name: "palette-all", preset: "minimal", palette: "glassmorphism", all: true },
  { name: "palette-radius", preset: "minimal", palette: "natural-organic" },
  { name: "palette-saas", preset: "saas", palette: "liquid-glass" },
];
const cases = projectCases.filter((item) => !values.case || item.name === values.case);
if (cases.length === 0) {
  throw new Error("Unknown palette acceptance case");
}
const database = new URL(VISUAL_DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
  throw new Error("Palette acceptance requires the local test database");
}
const catalog = await loadCatalog(join(repositoryRoot, "recipes/catalog.json"));
const knownEnvironment = new Set([
  ...Object.keys(parseEnv(await readFile(join(repositoryRoot, ".env.example"), "utf8"))),
  ...Object.values(catalog.modules).flatMap((module) => module.env),
  ...Object.values(catalog.adapters).flatMap((adapter) => adapter.env),
  "NODE_ENV", "NEXTDEVTPL_SKIN_TOKEN",
]);
const environment = { ...process.env };
for (const name of Object.keys(environment)) {
  if ([...knownEnvironment].some((key) => key.toUpperCase() === name.toUpperCase())) {
    delete environment[name];
  }
}
Object.assign(environment, {
  DATABASE_URL: database.href,
  BETTER_AUTH_SECRET: VISUAL_AUTH_SECRET,
  BETTER_AUTH_URL: VISUAL_BASE_URL,
  NEXT_PUBLIC_APP_URL: VISUAL_BASE_URL,
  NEXTDEVTPL_ALLOW_REMOTE_TEST_DATABASE: "0",
  NEXT_TELEMETRY_DISABLED: "1",
  NO_PROXY: "localhost,127.0.0.1,::1",
  CI: "1",
});

const requireGenerator = createRequire(new URL("../packages/create-nextdevtpl/package.json", import.meta.url));
const postcss = requireGenerator("postcss");
const root = await mkdtemp(join(tmpdir(), "nextdevtpl-skins-"));
const receiptPath = join(repositoryRoot, "artifacts/skins", `${basename(root)}-palettes.json`);
const receipt = { root, retained: keep, removed: false, completed: false, projects: {} };

async function saveReceipt() {
  await mkdir(dirname(receiptPath), { recursive: true });
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

function run(args, cwd) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn("pnpm", args, {
      cwd, env: environment, stdio: "inherit", windowsHide: true,
      shell: process.platform === "win32",
    });
    child.once("error", () => reject(new Error("Palette verification command could not start")));
    child.once("exit", (code) => code === 0 ? resolveProcess() : reject(new Error("Palette verification command failed")));
  });
}

async function addAllPaletteStyles(project, slugs) {
  const defaults = await readFile(join(repositoryRoot, "src/skin/tokens.css"), "utf8");
  const snapshot = await loadPaletteSnapshot(snapshotDirectory);
  const scopedStyles = [];
  const expected = [];
  for (const slug of slugs) {
    const palette = snapshot.themes[slug];
    if (!palette) throw new Error("Palette snapshot is missing an indexed theme");
    const applied = applyPaletteToTokensCss(defaults, palette);
    const stylesheet = postcss.parse(applied.css);
    let modeCount = 0;
    stylesheet.walkRules((rule) => {
      if (rule.selector === ":root") {
        rule.selector = `[data-palette="${slug}"]`;
        modeCount += 1;
      } else if (rule.selector === ".dark") {
        rule.selector = `[data-palette="${slug}"][data-mode="dark"]`;
        modeCount += 1;
      }
    });
    if (modeCount !== 2) throw new Error("Palette acceptance could not scope both modes");
    scopedStyles.push(stylesheet.toString());
    for (const mode of ["light", "dark"]) {
      expected.push({ slug, mode, background: palette[mode].colors.background, primary: palette[mode].colors.primary, radius: palette.light.radius });
    }
  }
  await writeFile(join(project, "src/app/palette-acceptance.css"), scopedStyles.join("\n"));
  const globalsPath = join(project, "src/app/globals.css");
  await writeFile(globalsPath, `@import "./palette-acceptance.css";\n${await readFile(globalsPath, "utf8")}`);
  const routeDirectory = join(project, "src/app/[locale]/palette-acceptance");
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(join(routeDirectory, "page.tsx"), `const slugs = ${JSON.stringify(slugs)};
export default function PaletteAcceptancePage() {
  return <main className="grid gap-4 p-4 md:grid-cols-3">
    {slugs.flatMap((slug) => (["light", "dark"] as const).map((mode) =>
      <section data-palette={slug} data-mode={mode} key={slug + mode}
        style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 16 }}>
        <h1 className="text-base font-semibold">{slug}</h1><p className="text-sm">{mode}</p>
        <button type="button" data-primary style={{ background: "var(--primary)", color: "var(--primary-foreground)", padding: "8px 12px", marginTop: 8 }}>Continue</button>
        <p className="text-sm" style={{ color: "var(--muted-foreground)", marginTop: 8 }}>Workspace</p>
      </section>))}
  </main>;
}
`);
  await writeFile(join(project, "palette-acceptance.json"), `${JSON.stringify(expected, null, 2)}\n`);
  return expected.length;
}

try {
  await saveReceipt();
  const manifest = JSON.parse(await readFile(join(snapshotDirectory, "snapshot.json"), "utf8"));
  const slugs = Object.keys(manifest.themes).sort();
  if (slugs.length === 0) throw new Error("Palette snapshot is empty");
  for (const item of cases) {
    const directory = join(root, item.name);
    const project = { directory, status: "running", steps: [], currentStep: "generate" };
    receipt.projects[item.name] = project;
    await saveReceipt();
    const generated = await generateProject({ targetDirectory: directory, preset: item.preset, palette: item.palette, install: false });
    project.modules = generated.manifest.modules;
    project.palette = generated.manifest.skin.palette;
    project.warnings = generated.warnings;
    if (project.palette?.id !== item.palette) throw new Error("Generated palette record is missing");
    const notice = await readFile(join(directory, "STYLEKIT-LICENSE.txt"), "utf8");
    if (!notice.includes("AnxForever") || !notice.includes("MIT License")) throw new Error("StyleKit notice is incomplete");
    if ((await readdir(directory)).includes("palettes")) throw new Error("Generated project contains the entire palette snapshot");
    if (item.all) project.renderedModes = await addAllPaletteStyles(directory, slugs);
    for (const [step, args] of [
      ["install", ["install", "--frozen-lockfile", "--prefer-offline", "--ignore-workspace"]],
      ["migration", ["run", "db:generate:init"]],
      ["lint", ["run", "lint"]],
      ["typecheck", ["run", "typecheck"]],
      ["smoke", ["run", "test:run"]],
      ["build", ["run", "build"]],
      ["health", ["run", "verify:health"]],
    ]) {
      project.currentStep = step;
      await saveReceipt();
      await run(args, directory);
      project.steps.push(step);
    }
    project.status = "passed";
    delete project.currentStep;
    await saveReceipt();
  }
  receipt.completed = true;
} catch (error) {
  const active = Object.values(receipt.projects).find((project) => project.status === "running");
  if (active) active.status = "failed";
  throw error;
} finally {
  if (!keep) {
    await rm(root, { recursive: true, force: true });
    receipt.removed = true;
    receipt.retained = false;
  }
  await saveReceipt();
  process.stdout.write(`Palette project receipt: ${receiptPath}\n`);
}
