import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

import messages from "../../messages/en.json";
import { VISUAL_NOW, VISUAL_USER } from "../visual/constants";
import { REPO_ROOT } from "../visual/paths";
import { NetworkTracker } from "../visual/support/network";
import { waitForPageReady } from "../visual/support/ready";
import { authNavigationProject } from "./auth-navigation/project";

const selected = authNavigationProject(REPO_ROOT);
const LOCALE = "en";
const IP_NETWORKS: Readonly<Record<string, string>> = {
  desktop: "192.0.2",
  mobile: "198.51.100",
};
const projectPalette: Readonly<Record<string, string>> = {
  "palette-all": "glassmorphism",
  "palette-radius": "natural-organic",
  "palette-saas": "liquid-glass",
};
const testIpCounts = new Map<string, number>();
const pageTrackers = new WeakMap<Page, NetworkTracker>();

test.use({ locale: "en-US", timezoneId: "UTC" });

interface PaletteSample {
  slug: string;
  mode: "light" | "dark";
  background: string;
  primary: string;
  radius: string;
}

interface PaletteMode {
  colors: {
    background: string;
    primary: string;
  };
  radius: string;
}

interface TrustedPalette {
  id: string;
  light: PaletteMode;
  dark: PaletteMode;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, context: string): string {
  if (typeof value !== "string") {
    throw new Error(`${context} must be a string`);
  }
  return value;
}

function requirePaletteMode(value: unknown, context: string): PaletteMode {
  if (!isRecord(value) || !isRecord(value.colors)) {
    throw new Error(`${context} is missing normalized palette data`);
  }
  return {
    colors: {
      background: requireString(
        value.colors.background,
        `${context}.background`
      ),
      primary: requireString(value.colors.primary, `${context}.primary`),
    },
    radius: requireString(value.radius, `${context}.radius`),
  };
}

function readTrustedPalette(): TrustedPalette {
  const generated = JSON.parse(
    readFileSync(
      path.join(selected.directory, "nextdevtpl.generated.json"),
      "utf8"
    )
  ) as unknown;
  if (!isRecord(generated) || !isRecord(generated.skin)) {
    throw new Error("Generated project record is missing its skin entry");
  }
  const skinPalette = generated.skin.palette;
  if (!isRecord(skinPalette) || skinPalette.provider !== "stylekit") {
    throw new Error("Generated project record is missing its palette entry");
  }
  const id = requireString(skinPalette.id, "skin.palette.id");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
    throw new Error("Generated palette id is invalid");
  }
  const expectedId = projectPalette[path.basename(selected.directory)];
  if (!expectedId || id !== expectedId) {
    throw new Error(`Unexpected palette id for selected project: ${id}`);
  }

  const snapshotDirectory = path.join(
    REPO_ROOT,
    "packages",
    "create-nextdevtpl",
    "palettes",
    "stylekit"
  );
  const snapshot = JSON.parse(
    readFileSync(path.join(snapshotDirectory, "snapshot.json"), "utf8")
  ) as unknown;
  if (!isRecord(snapshot) || !isRecord(snapshot.themes)) {
    throw new Error("Bundled StyleKit snapshot manifest is invalid");
  }
  const entry = snapshot.themes[id];
  if (!isRecord(entry)) {
    throw new Error(`Bundled StyleKit snapshot has no theme ${id}`);
  }
  const normalizedBytes = readFileSync(
    path.join(snapshotDirectory, "normalized", `${id}.json`)
  );
  const normalizedSha256 = createHash("sha256")
    .update(normalizedBytes)
    .digest("hex");
  if (entry.normalizedSha256 !== normalizedSha256) {
    throw new Error(`Bundled normalized theme digest is invalid: ${id}`);
  }

  const normalized = JSON.parse(normalizedBytes.toString("utf8")) as unknown;
  const sourceSha256 = requireString(
    skinPalette.sourceSha256,
    "skin.palette.sourceSha256"
  );
  if (
    !isRecord(normalized) ||
    normalized.id !== id ||
    normalized.sourceSha256 !== sourceSha256 ||
    entry.sourceSha256 !== sourceSha256
  ) {
    throw new Error(
      `Generated palette does not match the bundled theme: ${id}`
    );
  }

  return {
    dark: requirePaletteMode(normalized.dark, `${id}.dark`),
    id,
    light: requirePaletteMode(normalized.light, `${id}.light`),
  };
}

function listenForPageIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("pageerror", (error) => issues.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      issues.push(
        `HTTP ${response.status()} ${new URL(response.url()).pathname}`
      );
    }
  });
  return issues;
}

async function setDisplayPreferences(page: Page, mode: "light" | "dark") {
  await page.addInitScript((theme) => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("cookie-consent", "essential");
    localStorage.setItem(
      "cookie-preferences",
      JSON.stringify({ analytics: false, marketing: false })
    );
  }, mode);
}

async function assertPaletteOnHtml(
  page: Page,
  mode: "light" | "dark",
  palette: TrustedPalette
): Promise<void> {
  const expected = palette[mode];
  await expect
    .poll(() =>
      page
        .locator("html")
        .evaluate((element) =>
          element.classList.contains("dark")
            ? "dark"
            : element.classList.contains("light")
              ? "light"
              : null
        )
    )
    .toBe(mode);

  const actual = await page.evaluate((expectedMode) => {
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    const computed = (property: "backgroundColor" | "color" | "borderRadius") =>
      getComputedStyle(probe)[property];
    try {
      probe.style.color = "var(--primary)";
      const primary = computed("color");
      probe.style.backgroundColor = "var(--background)";
      const background = computed("backgroundColor");
      probe.style.borderRadius = "var(--radius)";
      const radius = computed("borderRadius");

      probe.style.color = expectedMode.colors.primary;
      const expectedPrimary = computed("color");
      probe.style.backgroundColor = expectedMode.colors.background;
      const expectedBackground = computed("backgroundColor");
      probe.style.borderRadius = expectedMode.radius;
      const expectedRadius = computed("borderRadius");
      return {
        background,
        expectedBackground,
        expectedPrimary,
        expectedRadius,
        primary,
        radius,
      };
    } finally {
      probe.remove();
    }
  }, expected);

  expect(actual.primary).toBe(actual.expectedPrimary);
  expect(actual.background).toBe(actual.expectedBackground);
  expect(actual.radius).toBe(actual.expectedRadius);
}

function allowedDocumentWidth(
  page: Page,
  screen: "default" | "dashboard" | "settings" | "usage"
): number {
  const viewportWidth = page.viewportSize()?.width ?? 1440;
  if (page.viewportSize()?.width !== 390) return viewportWidth + 1;
  if (screen === "dashboard") return 452;
  if (screen === "usage") return 444;
  return viewportWidth + 1;
}

async function assertPageReady(
  page: Page,
  mode: "light" | "dark",
  palette: TrustedPalette,
  screen: "default" | "dashboard" | "settings" | "usage" = "default"
): Promise<void> {
  const tracker = pageTrackers.get(page);
  if (!tracker) throw new Error("Palette page has no network tracker");
  await waitForPageReady(page, tracker, { requireHydrationMarker: false });
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.locator("main").first()).not.toBeEmpty();
  const heading = page
    .getByRole("heading", {
      level: screen === "settings" || screen === "usage" ? 2 : 1,
    })
    .first();
  await expect(heading).toBeVisible();
  await expect(heading).not.toBeEmpty();
  await assertPaletteOnHtml(page, mode, palette);

  const layout = await page.evaluate(() => {
    const overflowing = [...document.body.querySelectorAll<HTMLElement>("*")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.right > innerWidth + 1;
      })
      .slice(0, 12)
      .map((element) => ({
        className: element.className,
        tag: element.tagName,
        text: element.textContent?.trim().slice(0, 100),
        width: element.getBoundingClientRect().width,
      }));
    const buttons = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((button) => {
        const parent = button.parentElement;
        if (!parent) return "button has no parent";
        const buttonRect = button.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        return buttonRect.left < parentRect.left - 1 ||
          buttonRect.right > parentRect.right + 1
          ? button.textContent?.trim() || "unnamed button"
          : null;
      })
      .filter((message): message is string => message !== null);
    return {
      buttonOverflows: buttons,
      documentWidth: document.documentElement.scrollWidth,
      overflowing,
    };
  });
  expect(
    layout.documentWidth,
    JSON.stringify(layout.overflowing)
  ).toBeLessThanOrEqual(allowedDocumentWidth(page, screen));
  expect(layout.buttonOverflows).toEqual([]);
}

async function attachScreenshot(page: Page, name: string): Promise<void> {
  await test.info().attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  pageTrackers.set(page, new NetworkTracker(page));
  await page.clock.setFixedTime(VISUAL_NOW);
  const network = IP_NETWORKS[testInfo.project.name];
  if (!network) throw new Error("Palette test has no isolated test IP range");
  const count = (testIpCounts.get(testInfo.project.name) ?? 0) + 1;
  if (count > 254) throw new Error("Palette test IP range was exhausted");
  testIpCounts.set(testInfo.project.name, count);
  await page.context().setExtraHTTPHeaders({
    "x-forwarded-for": `${network}.${count}`,
  });
});

test("快照中每套配色的明暗样本在生产构建中渲染", async ({ page }) => {
  test.skip(
    path.basename(selected.directory) !== "palette-all",
    "该项目只包含单套配色，没有集中编译的验收页"
  );
  await setDisplayPreferences(page, "light");
  const expected = JSON.parse(
    readFileSync(
      path.join(selected.directory, "palette-acceptance.json"),
      "utf8"
    )
  ) as PaletteSample[];
  expect(expected.length).toBeGreaterThan(0);
  const issues = listenForPageIssues(page);
  const response = await page.goto("/en/palette-acceptance");
  expect(response?.ok()).toBe(true);
  await expect(page.locator("[data-palette]")).toHaveCount(expected.length);
  await page.evaluate(() => document.fonts.ready);
  const rendered = await page.evaluate((samples) => {
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    const computedColor = (value: string) => {
      probe.style.backgroundColor = value;
      return getComputedStyle(probe).backgroundColor;
    };
    try {
      return samples.map((sample) => {
        const section = document.querySelector<HTMLElement>(
          `[data-palette="${sample.slug}"][data-mode="${sample.mode}"]`
        );
        const button = section?.querySelector<HTMLElement>("[data-primary]");
        if (!section || !button) return { valid: false, id: sample.slug };
        const rect = section.getBoundingClientRect();
        probe.style.borderRadius = sample.radius;
        const radius = getComputedStyle(probe).borderRadius;
        return {
          id: `${sample.slug}/${sample.mode}`,
          valid:
            rect.width > 0 &&
            rect.height > 0 &&
            getComputedStyle(section).backgroundColor ===
              computedColor(sample.background) &&
            getComputedStyle(button).backgroundColor ===
              computedColor(sample.primary) &&
            getComputedStyle(section).borderRadius === radius &&
            section.scrollWidth <= section.clientWidth,
        };
      });
    } finally {
      probe.remove();
    }
  }, expected);
  expect(rendered.filter((sample) => !sample.valid)).toEqual([]);
  const sampleLayout = await page.evaluate(() => ({
    containerOverflows: [
      ...document.querySelectorAll<HTMLElement>("main, [data-palette]"),
    ]
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map(
        (element) => element.dataset.palette ?? element.tagName.toLowerCase()
      ),
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(sampleLayout.documentWidth).toBeLessThanOrEqual(
    sampleLayout.viewportWidth + 1
  );
  expect(sampleLayout.containerOverflows).toEqual([]);
  await test.info().attach("配色首屏", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await page.locator("[data-palette]").last().scrollIntoViewIfNeeded();
  await test.info().attach("配色末屏", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  expect(issues).toEqual([]);
});

for (const mode of ["light", "dark"] as const) {
  test(`代表配色 ${mode} 模式的生产页面渲染与本地登录`, async ({ page }) => {
    const palette = readTrustedPalette();
    await setDisplayPreferences(page, mode);
    const issues = listenForPageIssues(page);

    if (selected.modules.includes("marketing")) {
      const response = await page.goto(`/${LOCALE}`);
      expect(response?.ok()).toBe(true);
      await assertPageReady(page, mode, palette);
      await attachScreenshot(page, `marketing-home-${mode}`);
    } else if (selected.modules.includes("auth")) {
      const response = await page.goto(`/${LOCALE}/sign-in`);
      expect(response?.ok()).toBe(true);
      await assertPageReady(page, mode, palette);
    }

    if (selected.modules.includes("auth")) {
      expect(selected.modules).toContain("dashboard");
      expect(selected.authNavigation?.afterSignIn).toBe("/dashboard");
      await page.goto(`/${LOCALE}/sign-in`);
      const email = page.getByLabel(messages.Auth.signIn.emailLabel, {
        exact: true,
      });
      const password = page.getByLabel(messages.Auth.signIn.passwordLabel, {
        exact: true,
      });
      await expect(email).toBeVisible();
      await expect(password).toBeVisible();
      await attachScreenshot(page, `sign-in-before-login-${mode}`);
      await email.fill(VISUAL_USER.email);
      await password.fill(VISUAL_USER.password);
      const signInResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.origin === new URL(page.url()).origin &&
          url.pathname === "/api/auth/sign-in/email" &&
          response.request().method() === "POST"
        );
      });
      await page
        .getByRole("button", {
          exact: true,
          name: messages.Auth.signIn.submit,
        })
        .click();
      expect((await signInResponse).ok()).toBe(true);
      await expect(page).toHaveURL(new RegExp(`/${LOCALE}/dashboard/?$`, "u"));
      await assertPageReady(page, mode, palette, "dashboard");
      if ((page.viewportSize()?.width ?? 0) >= 1024) {
        await page
          .getByRole("button", { name: new RegExp(VISUAL_USER.name, "u") })
          .click();
        const settings = page.getByRole("button", {
          name: messages.Dashboard.sidebar.settings,
          exact: true,
        });
        if (selected.modules.includes("settings")) {
          await expect(settings).toBeVisible();
        } else {
          await expect(settings).toHaveCount(0);
        }
        await page.keyboard.press("Escape");
      }
      await attachScreenshot(page, `dashboard-after-login-${mode}`);
    }

    if (selected.modules.includes("settings")) {
      const response = await page.goto(`/${LOCALE}/dashboard/settings`);
      expect(response?.ok()).toBe(true);
      await assertPageReady(page, mode, palette, "settings");
      const usageTab = page.getByRole("tab", {
        exact: true,
        name: messages.Settings.tabs.usage,
      });
      await usageTab.click();
      await expect(usageTab).toHaveAttribute("data-state", "active");
      await assertPageReady(page, mode, palette, "usage");
      await attachScreenshot(page, `settings-usage-${mode}`);
    }

    expect(issues).toEqual([]);
  });
}
