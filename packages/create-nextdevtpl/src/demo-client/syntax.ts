import { extname, posix } from "node:path";
import ts from "typescript";

import { failSkin } from "../skins/errors.js";

export const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
] as const;

const OTHER_PACKAGE_EXTENSIONS = [
  ".css",
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
] as const;

export interface ViewExpression {
  readonly id: string;
  readonly expression: ts.Expression;
}

export function sourceKind(path: string): ts.ScriptKind {
  const extension = extname(path).toLowerCase();
  return extension === ".tsx" || extension === ".jsx"
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
}

export function isSourcePath(path: string): boolean {
  return SOURCE_EXTENSIONS.includes(
    extname(path).toLowerCase() as (typeof SOURCE_EXTENSIONS)[number]
  );
}

export function packageCandidates(base: string): string[] {
  const extension = extname(base);
  if (extension) return [base];
  return [
    ...SOURCE_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...OTHER_PACKAGE_EXTENSIONS.map((candidate) => `${base}${candidate}`),
    ...SOURCE_EXTENSIONS.map((candidate) => `${base}/index${candidate}`),
  ];
}

export function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

export function propertyNameText(
  name: ts.PropertyName | undefined
): string | undefined {
  if (!name || ts.isComputedPropertyName(name)) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return undefined;
}

export function runtimeModuleSpecifiers(source: ts.SourceFile): string[] {
  const result: string[] = [];
  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      isRuntimeImportClause(statement.importClause) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      result.push(statement.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(statement) &&
      isRuntimeExport(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      result.push(statement.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(statement) &&
      !statement.isTypeOnly &&
      ts.isExternalModuleReference(statement.moduleReference) &&
      statement.moduleReference.expression &&
      ts.isStringLiteral(statement.moduleReference.expression)
    ) {
      result.push(statement.moduleReference.expression.text);
    }
  }

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) {
        result.push(argument.text);
      }
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require"
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) {
        result.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return result;
}

export function isServerOnlySpecifier(specifier: string): boolean {
  return (
    specifier === "server-only" ||
    specifier.startsWith("server-only/") ||
    specifier === "next-intl/server" ||
    specifier.startsWith("next-intl/server/")
  );
}

function isRuntimeImportClause(clause: ts.ImportClause | undefined): boolean {
  if (!clause) return true;
  if (clause.isTypeOnly) return false;
  if (clause.name) return true;
  if (!clause.namedBindings) return false;
  if (ts.isNamespaceImport(clause.namedBindings)) return true;
  return clause.namedBindings.elements.some((element) => !element.isTypeOnly);
}

function isRuntimeExport(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) return false;
  if (!node.exportClause) return true;
  if (ts.isNamespaceExport(node.exportClause)) return true;
  return node.exportClause.elements.some((element) => !element.isTypeOnly);
}

export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? ts.getModifiers(node)
    : undefined;
  return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

export function viewExpressions(
  source: ts.SourceFile,
  entryPath: string
): ViewExpression[] {
  const declarations: ts.VariableDeclaration[] = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "views"
      ) {
        declarations.push(declaration);
      }
    }
  }
  const initializer = declarations[0]?.initializer;
  if (
    declarations.length !== 1 ||
    !initializer ||
    !ts.isObjectLiteralExpression(unwrapExpression(initializer))
  ) {
    failSkin([
      `Demo view entry must export a static views object: ${entryPath}`,
    ]);
  }
  const object = unwrapExpression(initializer) as ts.ObjectLiteralExpression;
  return object.properties.flatMap((property) => {
    if (
      !ts.isPropertyAssignment(property) ||
      ts.isComputedPropertyName(property.name)
    ) {
      return [];
    }
    const id = propertyNameText(property.name);
    return id
      ? [{ id, expression: unwrapExpression(property.initializer) }]
      : [];
  });
}

export function localImportBase(
  importer: string,
  specifier: string
): string | undefined {
  if (specifier.startsWith("@/skin/")) {
    return specifier.slice("@/skin/".length);
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return posix.normalize(posix.join(posix.dirname(importer), specifier));
  }
  return undefined;
}
