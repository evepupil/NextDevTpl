import { VISUAL_LOCALES, VISUAL_THEMES, VISUAL_VIEWPORTS } from "./constants";
import { VISUAL_TARGETS } from "./pages";

export function getExpectedVisualTestIds(): string[] {
  return Object.keys(VISUAL_VIEWPORTS)
    .flatMap((device) =>
      VISUAL_THEMES.flatMap((theme) =>
        VISUAL_LOCALES.flatMap((locale) =>
          VISUAL_TARGETS.map(
            (target) => `${device}-${theme}:${locale}-${target.id}`
          )
        )
      )
    )
    .sort();
}

function hasExactIds(expected: readonly string[], actual: readonly string[]) {
  if (actual.length !== expected.length) return false;

  const actualSet = new Set(actual);
  return (
    actualSet.size === actual.length &&
    expected.every((id) => actualSet.has(id))
  );
}

export function isCompleteVisualRun(
  selectedTestIds: readonly string[],
  passedTestIds: readonly string[]
): boolean {
  const expected = getExpectedVisualTestIds();
  return (
    hasExactIds(expected, selectedTestIds) &&
    hasExactIds(expected, passedTestIds)
  );
}
