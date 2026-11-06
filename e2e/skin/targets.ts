import { VISUAL_TARGETS, type VisualTarget } from "../visual/pages";

export interface SkinTarget {
  target: VisualTarget;
  view: string;
}

export function skinTargets(modules: readonly string[]): readonly SkinTarget[] {
  const views: Record<string, string> = {
    home: "marketing.home",
    "legal-terms": "marketing.legal",
    "blog-list": "blog.list",
    "blog-post": "blog.post",
    "pseo-list": "pseo.list",
    "pseo-detail": "pseo.detail",
    "sign-in": "auth.sign-in",
    "sign-up": "auth.sign-up",
    "forgot-password": "auth.forgot-password",
    "reset-password": "auth.reset-password",
    dashboard: modules.includes("credits")
      ? "dashboard.overview"
      : "shared.empty-dashboard",
    settings: "settings.page",
    "settings-security": "settings.page",
    "settings-billing": "settings.page",
    "settings-usage": "settings.page",
    credits: "settings.page",
    "credits-buy": "settings.page",
    "support-list": "support.list",
    "support-new": "support.new",
    "support-detail": "support.detail",
  };
  const viewFor = (id: string): string => {
    const view = views[id];
    if (!view) throw new Error(`缺少验收视图编号：${id}`);
    return view;
  };
  const targets = VISUAL_TARGETS.filter((target) => {
    if (target.id === "dashboard") return modules.includes("dashboard");
    if (target.kind === "redirect") {
      return modules.includes("credits") && modules.includes("settings");
    }
    return modules.some((module) =>
      viewFor(target.id).startsWith(`${module}.`)
    );
  }).map((target) => ({ target, view: viewFor(target.id) }));
  if (modules.includes("marketing") && modules.includes("blog")) {
    targets.push({
      target: {
        auth: false,
        group: "marketing",
        id: "docs-header",
        kind: "screenshot",
        path: "/docs",
      },
      view: "marketing.header",
    });
  }
  return targets;
}
