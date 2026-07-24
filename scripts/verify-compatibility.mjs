import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

import { generateProject } from "../packages/create-nextdevtpl/dist/index.js";
import {
  assertBuildArtifact,
  assertGeneratedProject,
} from "./compatibility/assertions.mjs";
import { runCommand, toWslPath } from "./compatibility/process.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(repositoryRoot, ".env.test"), quiet: true });

const matrix = JSON.parse(
  await readFile(join(repositoryRoot, "tests/compatibility/matrix.json"), "utf8")
);
const exemptionDocument = JSON.parse(
  await readFile(
    join(repositoryRoot, "tests/compatibility/exemptions.json"),
    "utf8"
  )
);
const args = process.argv.slice(2);
const requestedCase = args.includes("--case")
  ? args[args.indexOf("--case") + 1]
  : undefined;
const structureOnly = args.includes("--structure-only");
const keep = args.includes("--keep");
const selectedCases = requestedCase
  ? matrix.cases.filter((entry) => entry.id === requestedCase)
  : matrix.cases;

if (requestedCase && selectedCases.length === 0) {
  throw new Error(`Unknown compatibility case: ${requestedCase}`);
}

for (const exemption of exemptionDocument.exemptions) {
  if (Date.parse(exemption.expiresAt) <= Date.now()) {
    throw new Error(
      `Compatibility exemption expired: ${exemption.caseId}/${exemption.stage}`
    );
  }
}

const reportsRoot = join(repositoryRoot, "artifacts", "compatibility");
await mkdir(reportsRoot, { recursive: true });
const workingRoot = await mkdtemp(join(tmpdir(), "nextdevtpl-compatibility-"));
let failed = false;

async function runStage(report, matrixCase, stage, operation) {
  const startedAt = new Date().toISOString();
  try {
    const detail = await operation();
    report.stages.push({ stage, status: "passed", startedAt, detail });
  } catch (error) {
    const exemption = exemptionDocument.exemptions.find(
      (entry) => entry.caseId === matrixCase.id && entry.stage === stage
    );
    const message = error instanceof Error ? error.message : String(error);
    if (exemption) {
      report.stages.push({
        stage,
        status: "exempted",
        startedAt,
        message,
        exemption: {
          expiresAt: exemption.expiresAt,
          issue: exemption.issue,
          reason: exemption.reason,
        },
      });
      return;
    }
    report.stages.push({ stage, status: "failed", startedAt, message });
    throw error;
  }
}

try {
  for (const matrixCase of selectedCases) {
    const target = join(workingRoot, matrixCase.id);
    const report = {
      schemaVersion: 1,
      caseId: matrixCase.id,
      preset: matrixCase.preset,
      target: matrixCase.target,
      startedAt: new Date().toISOString(),
      stages: [],
    };
    process.stdout.write(`Verifying compatibility case: ${matrixCase.id}\n`);

    try {
      let manifest;
      await runStage(report, matrixCase, "generate", async () => {
        const result = await generateProject({
          targetDirectory: target,
          preset: matrixCase.preset,
          target: matrixCase.target,
          install: false,
        });
        manifest = result.manifest;
      });
      await runStage(report, matrixCase, "target-config", () =>
        assertGeneratedProject(target, matrixCase, manifest)
      );
      if (matrixCase.target === "docker") {
        await runStage(report, matrixCase, "deployment-config", async () => {
          const composeEnvironment = [
            "BETTER_AUTH_SECRET=compatibility-only-secret",
            "POSTGRES_PASSWORD=compatibility-only-password",
            "",
          ].join("\n");
          await writeFile(join(target, ".env"), composeEnvironment, "utf8");
          const command = process.platform === "win32" ? "wsl.exe" : "docker";
          const args =
            process.platform === "win32"
              ? [
                  "-d",
                  "Ubuntu-24.04",
                  "--cd",
                  toWslPath(target),
                  "docker",
                  "compose",
                  "config",
                  "--quiet",
                ]
              : ["compose", "config", "--quiet"];
          runCommand({ command, args, cwd: target });
        });
      }

      if (!structureOnly) {
        await runStage(report, matrixCase, "install", () =>
          runCommand({
            command: "pnpm",
            args: ["install", "--frozen-lockfile", "--prefer-offline"],
            cwd: target,
            retries: 1,
          })
        );
        await runStage(report, matrixCase, "migration", () =>
          runCommand({
            command: "pnpm",
            args: ["db:generate:init"],
            cwd: target,
          })
        );
        for (const stage of ["lint", "typecheck", "test"]) {
          await runStage(report, matrixCase, stage, () =>
            runCommand({
              command: "pnpm",
              args: [stage === "test" ? "test:run" : stage],
              cwd: target,
            })
          );
        }
        await runStage(report, matrixCase, "build", async () => {
          runCommand({
            command: "pnpm",
            args: [matrixCase.buildScript],
            cwd: target,
          });
          return assertBuildArtifact(target, matrixCase);
        });
        if (matrixCase.healthCheck) {
          await runStage(report, matrixCase, "health", () =>
            runCommand({
              command: "pnpm",
              args: ["verify:health"],
              cwd: target,
            })
          );
        }
      }
    } catch (error) {
      failed = true;
      process.stderr.write(
        `${matrixCase.id} failed: ${error instanceof Error ? error.message : String(error)}\n`
      );
    } finally {
      report.finishedAt = new Date().toISOString();
      await writeFile(
        join(reportsRoot, `${matrixCase.id}.json`),
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8"
      );
    }
  }
} finally {
  if (keep) process.stdout.write(`Compatibility workspace: ${workingRoot}\n`);
  else await rm(workingRoot, { recursive: true, force: true });
}

if (failed) process.exitCode = 1;
