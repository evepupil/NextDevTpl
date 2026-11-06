import { describe, expect, it } from "vitest";

import { VISUAL_LOCALES } from "../../../e2e/visual/constants";
import { VISUAL_TARGETS } from "../../../e2e/visual/pages";
import {
  getExpectedVisualTestIds,
  isCompleteVisualRun,
} from "../../../e2e/visual/coverage";

const PROJECT_NAMES = [
  "desktop-light",
  "desktop-dark",
  "mobile-light",
  "mobile-dark",
] as const;

function expectedMatrix(): string[] {
  return PROJECT_NAMES.flatMap((projectName) =>
    VISUAL_LOCALES.flatMap((locale) =>
      VISUAL_TARGETS.map((target) => `${projectName}:${locale}-${target.id}`)
    )
  );
}

describe("visual evidence coverage", () => {
  const expectedIds = expectedMatrix();

  it("returns the full page, locale, device, and theme matrix", () => {
    const screenshotCount = VISUAL_TARGETS.filter(
      (target) => target.kind === "screenshot"
    ).length;
    const redirectCount = VISUAL_TARGETS.filter(
      (target) => target.kind === "redirect"
    ).length;
    const actualIds = getExpectedVisualTestIds();

    expect(screenshotCount).toBe(18);
    expect(redirectCount).toBe(2);
    expect(VISUAL_TARGETS).toHaveLength(20);
    expect(screenshotCount * VISUAL_LOCALES.length * PROJECT_NAMES.length).toBe(
      144
    );
    expect(redirectCount * VISUAL_LOCALES.length * PROJECT_NAMES.length).toBe(
      16
    );
    expect(actualIds).toHaveLength(160);
    expect(new Set(actualIds).size).toBe(160);
    expect([...actualIds].sort()).toEqual([...expectedIds].sort());
    expect(actualIds).toContain("desktop-light:en-home");
    expect(actualIds).toContain("mobile-dark:zh-settings-usage");
    expect(actualIds).toContain("desktop-dark:en-credits");
    expect(actualIds).toContain("mobile-light:zh-credits-buy");
  });

  it("accepts the full matrix when selection and pass order differ", () => {
    expect(
      isCompleteVisualRun([...expectedIds].reverse(), [
        ...expectedIds.slice(17),
        ...expectedIds.slice(0, 17),
      ])
    ).toBe(true);
  });

  it("rejects desktop-only selection even when the pass list claims full coverage", () => {
    const desktopSelection = expectedIds.filter((id) =>
      id.startsWith("desktop-")
    );

    expect(isCompleteVisualRun(desktopSelection, expectedIds)).toBe(false);
  });

  it("rejects a missing redirect from the passed results", () => {
    const passedWithoutRedirect = expectedIds.filter(
      (id) => id !== "desktop-light:en-credits"
    );

    expect(isCompleteVisualRun(expectedIds, passedWithoutRedirect)).toBe(false);
  });

  it("rejects a selected test that failed or was omitted from passed results", () => {
    const passedWithoutScreenshot = expectedIds.filter(
      (id) => id !== "mobile-dark:zh-sign-up"
    );

    expect(isCompleteVisualRun(expectedIds, passedWithoutScreenshot)).toBe(
      false
    );
  });

  it.each([
    "selected",
    "passed",
  ] as const)("rejects a duplicate in the %s list that masks a missing ID", (list) => {
    const selected = [...expectedIds];
    const passed = [...expectedIds];
    const missingId = "mobile-light:en-support-detail";
    if (list === "selected") {
      selected.splice(selected.indexOf(missingId), 1);
      selected.push("desktop-light:en-home");
    } else {
      passed.splice(passed.indexOf(missingId), 1);
      passed.push("desktop-light:en-home");
    }

    expect(isCompleteVisualRun(selected, passed)).toBe(false);
  });

  it.each([
    "selected",
    "passed",
  ] as const)("rejects an unknown extra ID in the %s list", (list) => {
    const selected = [...expectedIds];
    const passed = [...expectedIds];
    if (list === "selected") selected.push("desktop-light:en-unknown-page");
    else passed.push("desktop-light:en-unknown-page");

    expect(isCompleteVisualRun(selected, passed)).toBe(false);
  });
});
