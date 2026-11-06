interface ViewEntry {
  id: string;
  kind: string;
}

interface ViewOwner {
  id: string;
  views?: readonly ViewEntry[];
}

const MODULE_VIEW_ID_PATTERN =
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export function validateModuleViews(manifests: readonly ViewOwner[]): string[] {
  const errors: string[] = [];
  const viewOwners = new Map<string, string>();

  for (const manifest of manifests) {
    for (const view of manifest.views ?? []) {
      if (
        !MODULE_VIEW_ID_PATTERN.test(view.id) ||
        !view.id.startsWith(`${manifest.id}.`)
      ) {
        errors.push(
          `模块 ${manifest.id} 登记了格式错误或归属不符的视图编号 ${view.id}`
        );
      }
      if (
        view.kind !== "page" &&
        view.kind !== "layout" &&
        view.kind !== "component"
      ) {
        errors.push(`模块 ${manifest.id} 的视图 ${view.id} 类型无效`);
      }
      const owner = viewOwners.get(view.id);
      if (owner) {
        errors.push(`视图 ${view.id} 同时属于 ${owner} 和 ${manifest.id}`);
      } else {
        viewOwners.set(view.id, manifest.id);
      }
    }
  }

  return errors;
}
