import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MODULE_IDS } from "@/core/modules";
import { resolveSkinAcceptanceProject } from "../../../e2e/skin/project";
import { skinTargets } from "../../../e2e/skin/targets";
import { REPO_ROOT } from "../../../e2e/visual/paths";

interface ReceiptProject {
  directory: string;
  status: string;
}

interface AcceptanceReceipt {
  root: string;
  retained: boolean;
  removed: boolean;
  completed: boolean;
  projects: Record<string, ReceiptProject>;
}

interface AcceptanceProjectFixture {
  root: string;
  directory: string;
  receipt: string;
  writeReceipt: (overrides?: Partial<AcceptanceReceipt>) => Promise<void>;
}

async function withAcceptanceProject(
  run: (fixture: AcceptanceProjectFixture) => Promise<void>
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "nextdevtpl-skins-acceptance-"));

  try {
    const name = "full-server";
    const directory = join(root, name);
    const receipt = join(root, "receipt.json");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "nextdevtpl.generated.json"),
      JSON.stringify({ modules: ["auth", "dashboard", "marketing"] }),
      "utf8"
    );

    const fixture: AcceptanceProjectFixture = {
      root,
      directory,
      receipt,
      async writeReceipt(overrides = {}) {
        const contents: AcceptanceReceipt = {
          root,
          retained: true,
          removed: false,
          completed: true,
          projects: {
            [name]: { directory, status: "passed" },
          },
          ...overrides,
        };
        await writeFile(receipt, JSON.stringify(contents), "utf8");
      },
    };

    await fixture.writeReceipt();
    await run(fixture);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function resolveProject(
  fixture: AcceptanceProjectFixture,
  directory = fixture.directory,
  repositoryRoot = REPO_ROOT
) {
  return resolveSkinAcceptanceProject({
    directory,
    receipt: fixture.receipt,
    repositoryRoot,
  });
}

describe("skin acceptance project receipt", () => {
  it("accepts a completed retained project that passed its checks", async () => {
    await withAcceptanceProject(async (fixture) => {
      const project = resolveProject(fixture);

      expect(project.directory).toBe(fixture.directory);
      expect(project.modules).toEqual(["auth", "dashboard", "marketing"]);
    });
  });

  it.each([
    "failed",
    "incomplete",
    "removed",
  ] as const)("rejects a %s project receipt", async (state) => {
    await withAcceptanceProject(async (fixture) => {
      if (state === "failed") {
        await fixture.writeReceipt({
          projects: {
            "full-server": {
              directory: fixture.directory,
              status: "failed",
            },
          },
        });
      } else if (state === "incomplete") {
        await fixture.writeReceipt({ completed: false });
      } else {
        await fixture.writeReceipt({ retained: false, removed: true });
      }

      expect(() => resolveProject(fixture)).toThrow();
    });
  });

  it("rejects using the repository itself as the generated project", async () => {
    await withAcceptanceProject(async (fixture) => {
      expect(() => resolveProject(fixture, REPO_ROOT, REPO_ROOT)).toThrow();
    });
  });

  it("rejects a receipt root outside the dedicated temporary root", async () => {
    const root = await mkdtemp(
      join(process.cwd(), "nextdevtpl-skins-outside-")
    );

    try {
      const directory = join(root, "full-server");
      const receipt = join(root, "receipt.json");
      const contents: AcceptanceReceipt = {
        root,
        retained: true,
        removed: false,
        completed: true,
        projects: {
          "full-server": { directory, status: "passed" },
        },
      };
      await writeFile(receipt, JSON.stringify(contents), "utf8");

      expect(() =>
        resolveSkinAcceptanceProject({
          directory,
          receipt,
          repositoryRoot: REPO_ROOT,
        })
      ).toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a generated project that is absent from the receipt", async () => {
    await withAcceptanceProject(async (fixture) => {
      const unlistedDirectory = join(fixture.root, "unlisted");
      await mkdir(unlistedDirectory);
      await writeFile(
        join(unlistedDirectory, "nextdevtpl.generated.json"),
        JSON.stringify({ modules: ["auth"] }),
        "utf8"
      );

      expect(() => resolveProject(fixture, unlistedDirectory)).toThrow();
    });
  });

  it("rejects a project without its generated module record", async () => {
    await withAcceptanceProject(async (fixture) => {
      await rm(join(fixture.directory, "nextdevtpl.generated.json"));

      expect(() => resolveProject(fixture)).toThrow();
    });
  });
});

describe("skin acceptance route targets", () => {
  it("maps every full-project page to its expected skin view marker", () => {
    const targets = skinTargets(MODULE_IDS).map(({ target, view }) => [
      target.id,
      view,
    ]);

    expect(targets).toEqual([
      ["home", "marketing.home"],
      ["legal-terms", "marketing.legal"],
      ["blog-list", "blog.list"],
      ["blog-post", "blog.post"],
      ["pseo-list", "pseo.list"],
      ["pseo-detail", "pseo.detail"],
      ["sign-in", "auth.sign-in"],
      ["sign-up", "auth.sign-up"],
      ["forgot-password", "auth.forgot-password"],
      ["reset-password", "auth.reset-password"],
      ["dashboard", "dashboard.overview"],
      ["credits", "settings.page"],
      ["credits-buy", "settings.page"],
      ["settings", "settings.page"],
      ["settings-security", "settings.page"],
      ["settings-billing", "settings.page"],
      ["settings-usage", "settings.page"],
      ["support-list", "support.list"],
      ["support-new", "support.new"],
      ["support-detail", "support.detail"],
      ["docs-header", "marketing.header"],
    ]);
  });

  it("uses the empty dashboard view for minimal modules without credits", () => {
    const dashboard = skinTargets(["auth", "dashboard", "shared"]).find(
      ({ target }) => target.id === "dashboard"
    );

    expect(dashboard?.view).toBe("shared.empty-dashboard");
  });

  it("omits dashboard and unselected business routes", () => {
    const modules = [
      "auth",
      "credits",
      "mail",
      "payment",
      "settings",
      "shared",
      "storage",
      "subscription",
      "support",
    ];
    const ids = skinTargets(modules).map(({ target }) => target.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "settings",
        "settings-security",
        "settings-billing",
        "settings-usage",
        "support-list",
        "support-new",
        "support-detail",
      ])
    );
    expect(ids).not.toContain("dashboard");
    expect(ids).not.toContain("home");
    expect(ids).not.toContain("blog-list");
    expect(ids).not.toContain("blog-post");
    expect(ids).not.toContain("pseo-list");
    expect(ids).not.toContain("pseo-detail");
    expect(ids).not.toContain("docs-header");
  });
});
