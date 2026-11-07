import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { generateProject } from "../../../packages/create-nextdevtpl/src/generate";

describe("generated view ownership", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "nextdevtpl-view-projects-"));
  });

  afterAll(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it("preserves selected settings and support routes when dashboard is excluded", async () => {
    const target = join(root, "protected-pages");
    const { manifest } = await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["auth", "settings", "support"],
      adapterOverrides: {
        payment: "payment:creem",
        storage: "storage:s3-compatible",
      },
      install: false,
    });

    expect(manifest.modules).not.toContain("dashboard");
    for (const route of [
      "settings",
      "support",
      "support/new",
      "support/[id]",
    ]) {
      await expect(
        access(
          join(
            target,
            "src/app/[locale]/(dashboard)/dashboard",
            route,
            "page.tsx"
          )
        )
      ).resolves.toBeUndefined();
    }
    await expect(
      access(join(target, "src/app/[locale]/(dashboard)/dashboard/page.tsx"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    for (const route of [
      "src/app/[locale]/(admin)/admin/page.tsx",
      "src/app/[locale]/(admin)/admin/users/page.tsx",
      "src/app/[locale]/(admin)/admin/tickets/page.tsx",
      "src/app/[locale]/(admin)/admin/tickets/[id]/page.tsx",
      "src/app/[locale]/(admin)/admin/layout.tsx",
    ]) {
      await expect(access(join(target, route))).rejects.toMatchObject({
        code: "ENOENT",
      });
    }
    await expect(
      access(join(target, "src/features/admin"))
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      access(join(target, "src/skin/views/dashboard"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    const registry = await readFile(
      join(target, "src/modules/skin-views.ts"),
      "utf8"
    );
    expect(registry).toContain("@/skin/views/settings");
    expect(registry).toContain("@/skin/views/support");
    expect(registry).not.toContain("@/skin/views/dashboard");
  });

  it("does not recreate an excluded dashboard for an auth-only project", async () => {
    const target = join(root, "auth-only");
    await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["auth"],
      install: false,
    });

    await expect(
      access(join(target, "src/app/[locale]/(dashboard)/dashboard/page.tsx"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      access(join(target, "src/features/dashboard"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    const runtime = await readFile(
      join(target, "src/modules/view-runtime.ts"),
      "utf8"
    );
    const pageFacades = await readFile(
      join(target, "src/modules/view-pages.tsx"),
      "utf8"
    );
    expect(runtime).not.toContain("@/features/dashboard");
    expect(runtime).not.toContain("@/features/credits");
    expect(runtime).not.toContain("@/features/subscription");
    expect(pageFacades).not.toContain("getWorkspaceSession");
    expect(pageFacades).not.toContain("@/i18n/routing");
  });

  it("keeps an authless dashboard free of authentication imports", async () => {
    const target = join(root, "public-dashboard");
    await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["dashboard"],
      install: false,
    });

    const files = [
      "src/modules/view-runtime.ts",
      "src/modules/view-data.ts",
      "src/app/[locale]/(dashboard)/layout.tsx",
      "src/app/[locale]/(dashboard)/dashboard/page.tsx",
    ];
    for (const file of files) {
      const source = await readFile(join(target, file), "utf8");
      expect(source).not.toContain("@/lib/auth");
      expect(source).not.toContain("@/features/auth");
    }
    await expect(
      access(join(target, "src/skin/views/auth"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      access(join(target, "src/skin/layouts/auth.tsx"))
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps unused overview providers out of a subscription workspace without credits", async () => {
    const target = join(root, "subscription-without-credits");
    await generateProject({
      targetDirectory: target,
      preset: "custom",
      modules: ["auth", "dashboard", "payment"],
      adapterOverrides: { payment: "payment:creem" },
      install: false,
    });

    const data = await readFile(
      join(target, "src/modules/view-data.ts"),
      "utf8"
    );
    const runtime = await readFile(
      join(target, "src/modules/view-runtime.ts"),
      "utf8"
    );
    const page = await readFile(
      join(target, "src/app/[locale]/(dashboard)/dashboard/page.tsx"),
      "utf8"
    );
    const pageFacades = await readFile(
      join(target, "src/modules/view-pages.tsx"),
      "utf8"
    );
    expect(data).not.toContain("@/features/subscription/server");
    expect(data).not.toContain("@/features/dashboard/server");
    expect(runtime).toContain("@/features/subscription/view");
    expect(pageFacades).not.toContain("getDashboardViewData");
    expect(page).toContain("<DashboardPage locale={locale} />");
    expect(pageFacades).toContain('skinViews["shared.empty-dashboard"]');
  });
});
