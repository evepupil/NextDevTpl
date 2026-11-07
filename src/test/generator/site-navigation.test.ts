import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";

import ts from "typescript";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadCatalog } from "../../../packages/create-nextdevtpl/src/catalog";
import { createProjectSelection } from "../../../packages/create-nextdevtpl/src/selection";
import type { RecipeCatalog } from "../../../packages/create-nextdevtpl/src/types";
import { writeWorkspaceComposition } from "../../../packages/create-nextdevtpl/src/workspace-composition";
import { footerNav, mainNav } from "../../config/nav";
import { filterMarketingNavigation } from "../../features/marketing/view";
import type { SiteNavigation } from "../../modules/site-navigation";

function importsNamedExport(
  source: string,
  moduleName: string,
  exportName: string
): boolean {
  const parsed = ts.createSourceFile(
    "skin-view.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  return parsed.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement)) return false;
    if (
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== moduleName
    ) {
      return false;
    }

    const bindings = statement.importClause?.namedBindings;
    return (
      bindings !== undefined &&
      ts.isNamedImports(bindings) &&
      bindings.elements.some((binding) => binding.name.text === exportName)
    );
  });
}

function callsFunction(source: string, functionName: string): boolean {
  const parsed = ts.createSourceFile(
    "marketing-controller.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  let found = false;

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === functionName
    ) {
      found = true;
    }
    ts.forEachChild(node, visit);
  };

  visit(parsed);
  return found;
}

describe("generated site navigation", () => {
  let root: string;
  let catalog: RecipeCatalog;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "nextdevtpl-site-navigation-"));
    catalog = await loadCatalog(resolve("recipes/catalog.json"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function writeNavigation(
    name: string,
    modules: readonly string[],
    docsEnabled = true
  ): Promise<SiteNavigation> {
    const target = join(root, name);
    await writeWorkspaceComposition(target, modules, { docsEnabled });

    const source = await readFile(
      join(target, "src", "modules", "site-navigation.ts"),
      "utf8"
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const exports: Record<string, unknown> = {};
    runInNewContext(compiled, { exports });

    const navigation = exports.siteNavigation as SiteNavigation | undefined;
    if (!navigation) throw new Error("Generated site navigation is missing");

    return {
      blogHref: navigation.blogHref,
      cookiePolicyHref: navigation.cookiePolicyHref,
      docsHref: navigation.docsHref,
      homeHref: navigation.homeHref,
      pseoHref: navigation.pseoHref,
      privacyHref: navigation.privacyHref,
      termsHref: navigation.termsHref,
    };
  }

  function selectedModules(preset: "minimal" | "saas"): readonly string[] {
    return createProjectSelection(catalog, { preset }).modules;
  }

  it("keeps the SaaS homepage and legal destinations without absent routes", async () => {
    await expect(
      writeNavigation("saas", selectedModules("saas"))
    ).resolves.toEqual({
      blogHref: null,
      cookiePolicyHref: "/legal/cookie-policy",
      docsHref: "/docs",
      homeHref: "/",
      pseoHref: null,
      privacyHref: "/legal/privacy",
      termsHref: "/legal/terms",
    });
  });

  it("uses the dashboard as the minimal preset destination", async () => {
    await expect(
      writeNavigation("minimal", selectedModules("minimal"))
    ).resolves.toEqual({
      blogHref: null,
      cookiePolicyHref: null,
      docsHref: "/docs",
      homeHref: "/dashboard",
      pseoHref: null,
      privacyHref: null,
      termsHref: null,
    });
  });

  it("uses sign-in when authentication is the only selected destination", async () => {
    const selection = createProjectSelection(catalog, {
      preset: "custom",
      modules: ["auth"],
    });

    await expect(
      writeNavigation("auth-only", selection.modules)
    ).resolves.toEqual({
      blogHref: null,
      cookiePolicyHref: null,
      docsHref: "/docs",
      homeHref: "/sign-in",
      pseoHref: null,
      privacyHref: null,
      termsHref: null,
    });
  });

  it("uses the dashboard in a public dashboard-only project", async () => {
    const selection = createProjectSelection(catalog, {
      preset: "custom",
      modules: ["dashboard"],
    });

    await expect(
      writeNavigation("public-dashboard", selection.modules)
    ).resolves.toEqual({
      blogHref: null,
      cookiePolicyHref: null,
      docsHref: "/docs",
      homeHref: "/dashboard",
      pseoHref: null,
      privacyHref: null,
      termsHref: null,
    });
  });

  it("hides unselected blog and PSEO links from the SaaS header and footer", async () => {
    const navigation = await writeNavigation(
      "saas-links",
      selectedModules("saas")
    );
    const headerLinks = filterMarketingNavigation(mainNav, navigation);
    const footerProductLinks = filterMarketingNavigation(
      footerNav.product,
      navigation
    );
    const footerLegalLinks = filterMarketingNavigation(
      footerNav.legal,
      navigation
    );

    expect(headerLinks.map((link) => link.href)).toEqual([
      "/docs",
      "/#pricing",
    ]);
    expect(footerProductLinks.map((link) => link.href)).not.toContain("/blog");
    expect(footerLegalLinks.map((link) => link.href)).toEqual([
      "/legal/terms",
      "/legal/privacy",
      "/legal/cookie-policy",
    ]);
  });

  it("retains blog and PSEO links when every module is selected", async () => {
    const navigation = await writeNavigation(
      "all-modules",
      Object.keys(catalog.modules)
    );

    expect(navigation.blogHref).toBe("/blog");
    expect(navigation.cookiePolicyHref).toBe("/legal/cookie-policy");
    expect(navigation.pseoHref).toBe("/pseo");
    expect(
      filterMarketingNavigation(mainNav, navigation).map((link) => link.href)
    ).toEqual(mainNav.map((link) => link.href));
    expect(
      filterMarketingNavigation(footerNav.product, navigation).map(
        (link) => link.href
      )
    ).toEqual(footerNav.product.map((link) => link.href));
  });

  it("omits Docs in demo navigation while keeping other selected routes", async () => {
    const modules = ["marketing", "blog", "pseo"];
    const navigation = await writeNavigation("demo", modules, false);

    expect(navigation.docsHref).toBeNull();
    expect(
      filterMarketingNavigation(mainNav, navigation).map((link) => link.href)
    ).toEqual(["/pseo", "/#pricing", "/blog"]);
  });

  it("keeps Docs for existing skins that omit the new navigation field", () => {
    expect(
      filterMarketingNavigation([{ href: "/docs" }], {
        blogHref: null,
        cookiePolicyHref: null,
        pseoHref: null,
        privacyHref: null,
        termsHref: null,
      })
    ).toEqual([{ href: "/docs" }]);
  });

  it("keeps skin components on the public feature view exports", async () => {
    const authFooter = await readFile(
      resolve("src/skin/views/auth/components/auth-footer.tsx"),
      "utf8"
    );
    const dashboardSidebar = await readFile(
      resolve("src/skin/views/shared/sidebar.tsx"),
      "utf8"
    );
    const marketingHeader = await readFile(
      resolve("src/skin/views/marketing/components/header.tsx"),
      "utf8"
    );
    const marketingHeaderController = await readFile(
      resolve("src/features/marketing/view/use-header-controller.ts"),
      "utf8"
    );
    const marketingFooterController = await readFile(
      resolve("src/features/marketing/view/use-footer-controller.ts"),
      "utf8"
    );

    expect(
      importsNamedExport(
        authFooter,
        "@/features/auth/view",
        "authSiteNavigation"
      )
    ).toBe(true);
    expect(
      importsNamedExport(
        dashboardSidebar,
        "@/features/shared/view",
        "sharedSiteNavigation"
      )
    ).toBe(true);
    expect(
      importsNamedExport(
        marketingHeader,
        "@/features/marketing/view",
        "MarketingHeaderViewProps"
      )
    ).toBe(true);
    expect(
      callsFunction(marketingHeaderController, "filterMarketingNavigation")
    ).toBe(true);
    expect(
      callsFunction(marketingFooterController, "filterMarketingNavigation")
    ).toBe(true);
  });
});
