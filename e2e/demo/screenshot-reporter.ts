import fs from "node:fs";
import path from "node:path";

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

import {
  VISUAL_LOCALES,
  VISUAL_THEMES,
  VISUAL_VIEWPORTS,
} from "../visual/constants";
import { VISUAL_TARGETS } from "../visual/pages";

const EXPECTED_ROUTE_SCREENSHOTS = 144;
const EXPECTED_ROUTE_TARGETS = 18;
const EXPECTED_REDIRECT_TARGETS = 2;
const SCREENSHOT_ATTACHMENT = "demo-route-screenshot";

interface ReporterOptions {
  readonly outputFile: string;
}

interface ScreenshotReceipt {
  readonly capturedRouteScreenshots: number;
  readonly complete: boolean;
  readonly expectedPageTests: number;
  readonly expectedRouteScreenshots: number;
  readonly matrixDefinitionValid: boolean;
  readonly missingPageTests: readonly string[];
  readonly missingPassingPageTests: readonly string[];
  readonly missingRouteScreenshots: readonly string[];
  readonly passedPageTests: number;
  readonly selectedPageTests: number;
}

function pageTestId(test: TestCase): string {
  const projectName = test.parent.project()?.name ?? "unknown";
  return `${projectName}:${test.title}`;
}

function isPageMatrixTest(test: TestCase): boolean {
  return path.basename(test.location.file) === "pages.spec.ts";
}

function hasExactCoverage(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return (
    actualSet.size === actual.length &&
    expected.every((id) => actualSet.has(id))
  );
}

function expectedMatrix(): {
  pageTests: string[];
  routeScreenshots: string[];
  matrixDefinitionValid: boolean;
} {
  const projects = Object.keys(VISUAL_VIEWPORTS).flatMap((device) =>
    VISUAL_THEMES.map((theme) => `${device}-${theme}`)
  );
  const pageTests = projects.flatMap((project) =>
    VISUAL_LOCALES.flatMap((locale) =>
      VISUAL_TARGETS.map((target) => `${project}:${locale} ${target.id}`)
    )
  );
  const screenshotTargets = VISUAL_TARGETS.filter(
    (target) => target.kind === "screenshot"
  );
  const redirectTargets = VISUAL_TARGETS.filter(
    (target) => target.kind === "redirect"
  );
  const routeScreenshots = projects.flatMap((project) =>
    VISUAL_LOCALES.flatMap((locale) =>
      screenshotTargets.map((target) => `${project}:${locale} ${target.id}`)
    )
  );
  return {
    pageTests,
    routeScreenshots,
    matrixDefinitionValid:
      screenshotTargets.length === EXPECTED_ROUTE_TARGETS &&
      redirectTargets.length === EXPECTED_REDIRECT_TARGETS &&
      routeScreenshots.length === EXPECTED_ROUTE_SCREENSHOTS,
  };
}

export default class DemoScreenshotReporter implements Reporter {
  private readonly outputFile: string;
  private selectedPageTests: string[] = [];
  private passedPageTests: string[] = [];
  private capturedRouteScreenshots: string[] = [];

  constructor(options: ReporterOptions) {
    this.outputFile = options.outputFile;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.selectedPageTests = suite
      .allTests()
      .filter(isPageMatrixTest)
      .map(pageTestId);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!isPageMatrixTest(test)) return;
    const id = pageTestId(test);
    if (result.status === "passed") this.passedPageTests.push(id);
    if (
      result.attachments.some(
        (attachment) => attachment.name === SCREENSHOT_ATTACHMENT
      )
    ) {
      this.capturedRouteScreenshots.push(id);
    }
  }

  onEnd(result: FullResult): void {
    const expected = expectedMatrix();
    const selectedPageTests = new Set(this.selectedPageTests);
    const passedPageTests = new Set(this.passedPageTests);
    const capturedRouteScreenshots = new Set(this.capturedRouteScreenshots);
    const receipt: ScreenshotReceipt = {
      capturedRouteScreenshots: capturedRouteScreenshots.size,
      complete:
        result.status === "passed" &&
        expected.matrixDefinitionValid &&
        hasExactCoverage(this.selectedPageTests, expected.pageTests) &&
        hasExactCoverage(this.passedPageTests, expected.pageTests) &&
        hasExactCoverage(
          this.capturedRouteScreenshots,
          expected.routeScreenshots
        ),
      expectedPageTests: expected.pageTests.length,
      expectedRouteScreenshots: EXPECTED_ROUTE_SCREENSHOTS,
      matrixDefinitionValid: expected.matrixDefinitionValid,
      missingPageTests: expected.pageTests.filter(
        (id) => !selectedPageTests.has(id)
      ),
      missingPassingPageTests: expected.pageTests.filter(
        (id) => !passedPageTests.has(id)
      ),
      missingRouteScreenshots: expected.routeScreenshots.filter(
        (id) => !capturedRouteScreenshots.has(id)
      ),
      passedPageTests: this.passedPageTests.length,
      selectedPageTests: this.selectedPageTests.length,
    };
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(
      `[demo] route screenshots ${receipt.capturedRouteScreenshots}/${receipt.expectedRouteScreenshots}; complete=${receipt.complete}`
    );
  }
}
