import postcss from "postcss";
import valueParser from "postcss-value-parser";

import { failSkin } from "./errors.js";
import type { SkinManifest } from "./types.js";

interface CssValidationOptions {
  content: string;
  manifest: SkinManifest;
  relativePath: string;
  templateDependencies: Readonly<Record<string, string>>;
  moduleRoot: (specifier: string) => string;
  isDeniedPackage: (name: string) => boolean;
  recordDependency: (name: string, importer: string) => void;
  resolveLocalPath: (importer: string, specifier: string) => Promise<string>;
}

function cssUrlValues(value: string): string[] {
  const parsed = valueParser(value);
  const urls: string[] = [];
  parsed.walk((node) => {
    if (node.type !== "function") return;
    if (node.value.includes("\\")) {
      failSkin(["Escaped CSS function names are not supported"]);
    }
    const functionName = node.value.toLowerCase();
    if (functionName === "image-set" || functionName === "-webkit-image-set") {
      let expectsImage = true;
      for (const child of node.nodes) {
        if (child.type === "div" && child.value === ",") {
          expectsImage = true;
        } else if (child.type === "space" || child.type === "comment") {
        } else if (expectsImage && child.type === "string") {
          urls.push(child.value);
          expectsImage = false;
        } else if (
          expectsImage &&
          child.type === "function" &&
          child.value.toLowerCase() === "url"
        ) {
          expectsImage = false;
        } else if (expectsImage && child.type === "word") {
          expectsImage = false;
        }
      }
      return;
    }
    if (functionName !== "url") return;
    const significant = node.nodes.filter(
      (child) => child.type !== "space" && child.type !== "comment"
    );
    if (significant.length !== 1) {
      failSkin(["CSS url() must have one static value"]);
    }
    const item = significant[0];
    if (!item || (item.type !== "string" && item.type !== "word")) {
      failSkin(["CSS url() must have one static value"]);
    }
    urls.push(item.value);
    return false;
  });
  return urls;
}

function validInlineImageDataUrl(value: string): boolean {
  return /^data:image\/(?:svg\+xml|png|jpe?g|webp|avif|gif|x-icon)(?:;[a-z0-9.+-]+(?:=[^,]*)?)*,/iu.test(
    value
  );
}

function isDeclaredInlineUse(
  manifest: SkinManifest,
  relativePath: string
): boolean {
  return manifest.assets.some(
    (asset) => asset.kind === "inline" && asset.files?.includes(relativePath)
  );
}

export async function inspectSkinCss(
  options: CssValidationOptions
): Promise<void> {
  const { content, manifest, relativePath } = options;
  let root: postcss.Root;
  try {
    root = postcss.parse(content, { from: relativePath });
  } catch {
    failSkin([`CSS could not be parsed: ${relativePath}`]);
  }

  const inspectNode = async (node: postcss.ChildNode): Promise<void> => {
    if (node.type === "atrule") {
      const token = `${node.name}${node.params}`
        .trimStart()
        .match(/^\S+/u)?.[0];
      if (token?.includes("\\")) {
        failSkin(["Escaped CSS at-rule names are not supported"]);
      }
      if (["config", "plugin"].includes(node.name.toLowerCase())) {
        failSkin(["Skin CSS must not load Tailwind configuration or plugins"]);
      }
    }
    if (node.type === "atrule" && node.name.toLowerCase() === "import") {
      const parsed = valueParser(node.params);
      const first = parsed.nodes.find(
        (item) => item.type !== "space" && item.type !== "comment"
      );
      let imported: string | undefined;
      if (first?.type === "string" || first?.type === "word") {
        imported = first.value;
      } else if (
        first?.type === "function" &&
        first.value.toLowerCase() === "url"
      ) {
        imported = cssUrlValues(node.params)[0];
      }
      if (!imported) {
        failSkin([`CSS @import must use a static path: ${relativePath}`]);
      }
      if (
        imported.startsWith("/") ||
        imported.startsWith("\\") ||
        /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(imported)
      ) {
        failSkin(["CSS @import must not load a remote or absolute URL"]);
      }
      if (imported.startsWith("./") || imported.startsWith("../")) {
        await options.resolveLocalPath(relativePath, imported);
      } else {
        const packageName = options.moduleRoot(imported);
        if (options.isDeniedPackage(packageName)) {
          failSkin(["CSS @import references a prohibited package"]);
        }
        options.recordDependency(packageName, relativePath);
        if (
          !manifest.dependencies[packageName] &&
          !options.templateDependencies[packageName]
        ) {
          failSkin(["CSS @import references an undeclared UI dependency"]);
        }
      }
      return;
    }

    const values =
      node.type === "decl"
        ? cssUrlValues(node.value)
        : node.type === "atrule"
          ? cssUrlValues(node.params)
          : [];
    for (const value of values) {
      if (value.startsWith("#")) continue;
      if (/^data:/iu.test(value)) {
        if (
          !validInlineImageDataUrl(value) ||
          !isDeclaredInlineUse(manifest, relativePath)
        ) {
          failSkin(["Inline CSS data URLs must be declared for this CSS file"]);
        }
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) || value.startsWith("//")) {
        failSkin(["CSS must not load remote assets"]);
      }
      await options.resolveLocalPath(relativePath, value);
    }
  };

  const nodes: postcss.ChildNode[] = [];
  root.walk((node) => {
    nodes.push(node);
  });
  for (const node of nodes) await inspectNode(node);
}
