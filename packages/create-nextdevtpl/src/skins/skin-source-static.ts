import ts from "typescript";

import { failSkin } from "./errors.js";
import type { SkinManifest, SkinTheme } from "./types.js";

function unwrapExpression(expression: ts.Expression): ts.Expression {
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

function literalText(expression: ts.Expression): string | undefined {
  const value = unwrapExpression(expression);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text;
  }
  return undefined;
}

function propertyNameText(
  name: ts.PropertyName | undefined
): string | undefined {
  if (!name || ts.isComputedPropertyName(name)) return undefined;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

function staticObjectProperties(
  expression: ts.Expression,
  label: string,
  relativePath: string
): Map<string, ts.Expression> {
  const value = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(value)) {
    failSkin([`${label} must be a static object: ${relativePath}`]);
  }
  const properties = new Map<string, ts.Expression>();
  for (const property of value.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      ts.isComputedPropertyName(property.name)
    ) {
      failSkin([`${label} contains a non-static member: ${relativePath}`]);
    }
    const name = propertyNameText(property.name);
    if (!name || properties.has(name)) {
      failSkin([
        `${label} contains an invalid or duplicate field: ${relativePath}`,
      ]);
    }
    properties.set(name, unwrapExpression(property.initializer));
  }
  return properties;
}

function staticString(value: ts.Expression | undefined): string | undefined {
  return value ? literalText(value) : undefined;
}

export function validateStaticSkinConfig(
  source: ts.SourceFile,
  manifest: SkinManifest,
  relativePath: string
): void {
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .filter((statement) =>
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    )
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find(
      (item) => ts.isIdentifier(item.name) && item.name.text === "skinConfig"
    );
  if (!declaration?.initializer) {
    failSkin([`config.ts must export a skinConfig object: ${relativePath}`]);
  }
  const root = staticObjectProperties(
    declaration.initializer,
    "skinConfig",
    relativePath
  );
  if (root.size !== 2 || !root.has("defaultTheme") || !root.has("fonts")) {
    failSkin([`skinConfig has an unsupported shape: ${relativePath}`]);
  }
  const theme = staticString(root.get("defaultTheme"));
  if (
    !theme ||
    !manifest.customization.defaultTheme.includes(theme as SkinTheme)
  ) {
    failSkin(["skinConfig.defaultTheme is not declared in skin.json"]);
  }
  const fonts = staticObjectProperties(
    root.get("fonts")!,
    "skinConfig.fonts",
    relativePath
  );
  if (
    fonts.size !== 3 ||
    !fonts.has("body") ||
    !fonts.has("heading") ||
    !fonts.has("mono")
  ) {
    failSkin(["skinConfig.fonts must specify body, heading, and mono"]);
  }
  const declaredFonts = manifest.customization.fonts;
  for (const name of ["body", "heading", "mono"] as const) {
    const font = staticString(fonts.get(name));
    if (
      !font ||
      (declaredFonts !== null &&
        !declaredFonts[name].some((option) => option.id === font))
    ) {
      failSkin([`skinConfig.fonts.${name} is not declared in skin.json`]);
    }
  }
}

export function exportedSkinViews(
  source: ts.SourceFile,
  relativePath: string
): string[] {
  const declarations: ts.VariableDeclaration[] = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    );
    if (!exported) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "views"
      ) {
        declarations.push(declaration);
      }
    }
  }
  if (declarations.length !== 1) {
    failSkin([
      `View entry must export exactly one views object: ${relativePath}`,
    ]);
  }
  const initializer = declarations[0]?.initializer;
  if (
    !initializer ||
    !ts.isObjectLiteralExpression(unwrapExpression(initializer))
  ) {
    failSkin([`View entry must export an explicit object: ${relativePath}`]);
  }
  const object = unwrapExpression(initializer) as ts.ObjectLiteralExpression;
  const ids: string[] = [];
  for (const property of object.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      ts.isComputedPropertyName(property.name)
    ) {
      failSkin([
        `View entry contains a computed or non-static member: ${relativePath}`,
      ]);
    }
    const id = propertyNameText(property.name);
    if (
      !id ||
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(
        id
      )
    ) {
      failSkin([`View entry contains an invalid view id: ${relativePath}`]);
    }
    let value = unwrapExpression(property.initializer);
    while (ts.isPropertyAccessExpression(value)) {
      if (!ts.isIdentifier(value.name)) break;
      value = unwrapExpression(value.expression);
    }
    if (!ts.isIdentifier(value)) {
      failSkin([
        `View entry values must be identifiers or static property references: ${relativePath}`,
      ]);
    }
    ids.push(id);
  }
  if (new Set(ids).size !== ids.length) {
    failSkin([`View entry contains duplicate view ids: ${relativePath}`]);
  }
  return ids;
}

export function skinModuleSpecifiers(
  source: ts.SourceFile,
  relativePath: string
): string[] {
  const specifiers: string[] = [];
  function addExpression(expression: ts.Expression, label: string): void {
    const specifier = literalText(expression);
    if (specifier === undefined) {
      failSkin([`${label} must use a static module name: ${relativePath}`]);
    }
    specifiers.push(specifier);
  }
  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node) && node.text === "require") {
      const directCall =
        ts.isCallExpression(node.parent) && node.parent.expression === node;
      if (!directCall) {
        failSkin([
          `Aliased or indirect require is not supported: ${relativePath}`,
        ]);
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "require"
    ) {
      failSkin([`Property-based require is not supported: ${relativePath}`]);
    }
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      if (!ts.isStringLiteral(node.moduleSpecifier)) {
        failSkin([`Module specifier must be static: ${relativePath}`]);
      }
      specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isImportEqualsDeclaration(node)) {
      if (
        !ts.isExternalModuleReference(node.moduleReference) ||
        !node.moduleReference.expression ||
        !ts.isStringLiteral(node.moduleReference.expression)
      ) {
        failSkin([
          `Import-equals must use a static module name: ${relativePath}`,
        ]);
      }
      specifiers.push(node.moduleReference.expression.text);
    } else if (ts.isImportTypeNode(node)) {
      if (!ts.isLiteralTypeNode(node.argument)) {
        failSkin([
          `Import type must use a static module name: ${relativePath}`,
        ]);
      }
      const argument = node.argument.literal;
      if (!ts.isStringLiteral(argument)) {
        failSkin([
          `Import type must use a static module name: ${relativePath}`,
        ]);
      }
      specifiers.push(argument.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      if (node.arguments.length !== 1) {
        failSkin([
          `Dynamic module loading must use one static name: ${relativePath}`,
        ]);
      }
      const argument = node.arguments[0];
      if (!argument)
        failSkin([
          `Dynamic module loading must use one static name: ${relativePath}`,
        ]);
      addExpression(argument, "Dynamic module name");
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specifiers;
}
