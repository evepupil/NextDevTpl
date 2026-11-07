import { extname, relative, resolve } from "node:path";
import ts from "typescript";

import { failSkin } from "../skins/errors.js";
import type { ValidatedSkin } from "../skins/types.js";
import { type DemoClientAnalysis, resolveSkinPackagePath } from "./graph.js";
import {
  type ComponentResolverContext,
  reactCreateElementComponent,
  resolveComponentExpression,
  type SourceNode,
} from "./symbols.js";
import {
  hasModifier,
  isSourcePath,
  sourceKind,
  viewExpressions,
} from "./syntax.js";

interface DemoClientProgram {
  readonly checker: ts.TypeChecker;
  readonly sourceFiles: ReadonlyMap<string, ts.SourceFile>;
}

const RENDER_CALLBACK_METHODS = new Set([
  "flatMap",
  "map",
  "reduce",
  "useMemo",
]);

function compilerExtension(path: string): ts.Extension {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith(".d.mts")) return ts.Extension.Dmts;
  if (lowerPath.endsWith(".d.cts")) return ts.Extension.Dcts;
  if (lowerPath.endsWith(".d.ts")) return ts.Extension.Dts;
  switch (extname(path).toLowerCase()) {
    case ".cts":
      return ts.Extension.Cts;
    case ".mts":
      return ts.Extension.Mts;
    case ".tsx":
      return ts.Extension.Tsx;
    case ".ts":
      return ts.Extension.Ts;
    case ".jsx":
      return ts.Extension.Jsx;
    default:
      return ts.Extension.Js;
  }
}

function canonicalPath(path: string): string {
  const resolved = resolve(path);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function createDemoClientProgram(
  skin: ValidatedSkin,
  analysis: DemoClientAnalysis
): DemoClientProgram {
  const options: ts.CompilerOptions = {
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: [],
  };
  const virtualSources = new Map<string, string>();
  for (const [path, content] of analysis.fileContents) {
    if (isSourcePath(path)) {
      virtualSources.set(
        canonicalPath(resolve(skin.directory, ...path.split("/"))),
        content.toString("utf8")
      );
    }
  }

  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  host.readFile = (fileName) =>
    virtualSources.get(canonicalPath(fileName)) ?? readFile(fileName);
  host.fileExists = (fileName) =>
    virtualSources.has(canonicalPath(fileName)) || fileExists(fileName);
  host.getSourceFile = (
    fileName,
    languageVersionOrOptions,
    onError,
    shouldCreateNewSourceFile
  ) => {
    const text = virtualSources.get(canonicalPath(fileName));
    if (text !== undefined) {
      return ts.createSourceFile(
        fileName,
        text,
        languageVersionOrOptions,
        true,
        sourceKind(fileName)
      );
    }
    return getSourceFile(
      fileName,
      languageVersionOrOptions,
      onError,
      shouldCreateNewSourceFile
    );
  };
  host.resolveModuleNames = (moduleNames, containingFile) => {
    const relativeImporter = relative(
      skin.directory,
      containingFile
    ).replaceAll("\\", "/");
    const packageImporter =
      relativeImporter !== ".." &&
      relativeImporter !== "" &&
      !relativeImporter.startsWith("../");
    return moduleNames.map((moduleName) => {
      if (!packageImporter) return undefined;
      const packagePath = resolveSkinPackagePath(
        relativeImporter,
        moduleName,
        analysis.packageFiles,
        skin
      );
      if (!packagePath || !isSourcePath(packagePath)) return undefined;
      return {
        extension: compilerExtension(packagePath),
        isExternalLibraryImport: false,
        resolvedFileName: resolve(skin.directory, ...packagePath.split("/")),
      };
    });
  };

  const rootNames = [...analysis.runtimeReachableFiles].map((path) =>
    resolve(skin.directory, ...path.split("/"))
  );
  const program = ts.createProgram({ rootNames, options, host });
  const sourceFiles = new Map<string, ts.SourceFile>();
  for (const path of analysis.runtimeReachableFiles) {
    const fileName = resolve(skin.directory, ...path.split("/"));
    const source = program.getSourceFile(fileName);
    if (source) sourceFiles.set(path, source);
  }
  return { checker: program.getTypeChecker(), sourceFiles };
}

function isFunctionDeclaration(
  node: ts.Node
): node is ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

function returnsPromiseLike(node: ts.Node, checker: ts.TypeChecker): boolean {
  if (!isFunctionDeclaration(node)) return false;
  if (hasModifier(node, ts.SyntaxKind.AsyncKeyword)) return true;
  const signature = checker.getSignatureFromDeclaration(node);
  if (!signature) return false;
  const returnType = checker.getReturnTypeOfSignature(signature);
  const awaitedType = checker.getAwaitedType(returnType);
  return (
    (awaitedType !== undefined && awaitedType !== returnType) ||
    hasModifier(node, ts.SyntaxKind.AsyncKeyword)
  );
}

function isEventAttribute(attribute: ts.JsxAttribute): boolean {
  const name = ts.isIdentifier(attribute.name) ? attribute.name.text : "";
  const firstSuffixCharacter = name.slice(2, 3);
  return (
    name.startsWith("on") &&
    firstSuffixCharacter !== "" &&
    firstSuffixCharacter === firstSuffixCharacter.toUpperCase() &&
    firstSuffixCharacter !== firstSuffixCharacter.toLowerCase()
  );
}

function eventHandlerNames(node: ts.Node): ReadonlySet<string> {
  const names = new Set<string>();
  const visit = (current: ts.Node) => {
    if (ts.isJsxAttribute(current) && isEventAttribute(current)) {
      const initializer = current.initializer;
      const expression =
        initializer && ts.isJsxExpression(initializer)
          ? initializer.expression
          : undefined;
      if (expression && ts.isIdentifier(expression)) names.add(expression.text);
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return names;
}

function isEventHandlerCallback(
  node: ts.Node,
  root: ts.Node,
  names: ReadonlySet<string>
): boolean {
  for (let current: ts.Node | undefined = node; current && current !== root; ) {
    if (ts.isJsxAttribute(current) && isEventAttribute(current)) return true;
    if (
      ts.isVariableDeclaration(current) &&
      ts.isIdentifier(current.name) &&
      names.has(current.name.text)
    ) {
      return true;
    }
    if (
      ts.isFunctionDeclaration(current) &&
      current.name &&
      names.has(current.name.text)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isRenderCallback(node: ts.Node, root: ts.Node): boolean {
  for (
    let current: ts.Node | undefined = node.parent;
    current && current !== root;
  ) {
    if (ts.isJsxExpression(current)) return true;
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      RENDER_CALLBACK_METHODS.has(current.expression.name.text)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function componentChildren(
  node: ts.Node,
  file: string,
  context: ComponentResolverContext,
  checker: ts.TypeChecker
): SourceNode[] {
  const expressions: ts.Expression[] = [];
  const handlers = eventHandlerNames(node);
  const visit = (current: ts.Node) => {
    if (current !== node && ts.isVariableDeclaration(current)) {
      if (ts.isIdentifier(current.name) && handlers.has(current.name.text)) {
        return;
      }
    }
    if (current !== node && ts.isFunctionLike(current)) {
      if (isEventHandlerCallback(current, node, handlers)) return;
      if (!isRenderCallback(current, node)) return;
    }
    if (
      ts.isJsxOpeningElement(current) ||
      ts.isJsxSelfClosingElement(current)
    ) {
      const tag = current.tagName;
      if (
        (ts.isIdentifier(tag) && /^[A-Z]/u.test(tag.text)) ||
        ts.isPropertyAccessExpression(tag)
      ) {
        expressions.push(tag);
      }
    }
    if (ts.isCallExpression(current)) {
      const component = reactCreateElementComponent(current, checker);
      if (component) expressions.push(component);
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return expressions.flatMap((expression) =>
    resolveComponentExpression(expression, file, context)
  );
}

function inspectViewComponent(
  root: SourceNode,
  viewId: string,
  resolver: ComponentResolverContext,
  checker: ts.TypeChecker,
  visited = new Set<string>()
): void {
  const value = root.node;
  const visitKey = `${root.file}:${value.pos}:${value.end}`;
  if (visited.has(visitKey)) return;
  visited.add(visitKey);

  if (returnsPromiseLike(value, checker)) {
    failSkin([
      `Demo view component must be synchronous: ${viewId} (${root.file})`,
    ]);
  }

  if (
    ts.isArrowFunction(value) ||
    ts.isFunctionExpression(value) ||
    ts.isFunctionDeclaration(value)
  ) {
    for (const child of componentChildren(
      value,
      root.file,
      resolver,
      checker
    )) {
      inspectViewComponent(child, viewId, resolver, checker, visited);
    }
    return;
  }

  if (ts.isCallExpression(value)) {
    for (const argument of value.arguments) {
      for (const child of resolveComponentExpression(
        argument,
        root.file,
        resolver
      )) {
        inspectViewComponent(child, viewId, resolver, checker, visited);
      }
    }
  }
}

export function validateDemoViewComponents(
  skin: ValidatedSkin,
  analysis: DemoClientAnalysis
): void {
  const program = createDemoClientProgram(skin, analysis);
  for (const moduleId of analysis.rootModules) {
    const entryPath = skin.manifest.viewEntries[moduleId];
    const source = entryPath ? program.sourceFiles.get(entryPath) : undefined;
    if (!entryPath || !source) continue;
    const resolver: ComponentResolverContext = {
      packageFiles: analysis.packageFiles,
      skin,
      sourceFiles: program.sourceFiles,
    };
    for (const view of viewExpressions(source, entryPath)) {
      const roots = resolveComponentExpression(
        view.expression,
        entryPath,
        resolver
      );
      for (const root of roots) {
        inspectViewComponent(root, view.id, resolver, program.checker);
      }
    }
  }
}
