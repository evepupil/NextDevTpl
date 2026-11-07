import ts from "typescript";

import type { ValidatedSkin } from "../skins/types.js";
import { resolveSkinPackagePath } from "./graph.js";
import { propertyNameText, unwrapExpression } from "./syntax.js";

export interface SourceNode {
  readonly file: string;
  readonly node: ts.Node;
}

export interface ComponentResolverContext {
  readonly sourceFiles: ReadonlyMap<string, ts.SourceFile>;
  readonly packageFiles: ReadonlySet<string>;
  readonly skin: ValidatedSkin;
}

type ReactBinding =
  | { kind: "default" | "namespace" }
  | { kind: "named"; importedName: string };

function reactImportBinding(
  identifier: ts.Identifier,
  checker: ts.TypeChecker
): ReactBinding | undefined {
  const symbol = checker.getSymbolAtLocation(identifier);
  for (const declaration of symbol?.declarations ?? []) {
    let current: ts.Node | undefined = declaration;
    while (current && !ts.isImportDeclaration(current)) {
      current = current.parent;
    }
    if (
      !current ||
      !ts.isStringLiteral(current.moduleSpecifier) ||
      current.moduleSpecifier.text !== "react"
    ) {
      continue;
    }

    const clause = current.importClause;
    if (!clause || clause.isTypeOnly) continue;
    if (ts.isImportSpecifier(declaration)) {
      if (declaration.isTypeOnly) continue;
      return {
        kind: "named",
        importedName: declaration.propertyName?.text ?? declaration.name.text,
      };
    }
    if (ts.isNamespaceImport(declaration)) return { kind: "namespace" };
    if (
      ts.isImportClause(declaration) &&
      declaration.name?.text === identifier.text
    ) {
      return { kind: "default" };
    }
  }
  return undefined;
}

function isCreateElementProperty(expression: ts.Expression): boolean {
  const value = unwrapExpression(expression);
  if (ts.isPropertyAccessExpression(value)) {
    return value.name.text === "createElement";
  }
  return (
    ts.isElementAccessExpression(value) &&
    value.argumentExpression !== undefined &&
    ts.isStringLiteralLike(value.argumentExpression) &&
    value.argumentExpression.text === "createElement"
  );
}

export function reactCreateElementComponent(
  call: ts.CallExpression,
  checker: ts.TypeChecker
): ts.Expression | undefined {
  const callee = unwrapExpression(call.expression);
  if (ts.isIdentifier(callee)) {
    const binding = reactImportBinding(callee, checker);
    return binding?.kind === "named" && binding.importedName === "createElement"
      ? call.arguments[0]
      : undefined;
  }
  if (!isCreateElementProperty(callee)) return undefined;
  const receiver =
    ts.isPropertyAccessExpression(callee) ||
    ts.isElementAccessExpression(callee)
      ? unwrapExpression(callee.expression)
      : undefined;
  if (!receiver || !ts.isIdentifier(receiver)) return undefined;
  const binding = reactImportBinding(receiver, checker);
  return binding?.kind === "default" || binding?.kind === "namespace"
    ? call.arguments[0]
    : undefined;
}

interface ImportBinding {
  readonly moduleSpecifier: string;
  readonly exportName: string | null;
}

function namedImportBinding(
  source: ts.SourceFile,
  localName: string
): ImportBinding | undefined {
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    if (clause.name?.text === localName) {
      return {
        moduleSpecifier: statement.moduleSpecifier.text,
        exportName: "default",
      };
    }
    const bindings = clause.namedBindings;
    if (!bindings) continue;
    if (ts.isNamespaceImport(bindings) && bindings.name.text === localName) {
      return {
        moduleSpecifier: statement.moduleSpecifier.text,
        exportName: null,
      };
    }
    if (!ts.isNamedImports(bindings)) continue;
    const match = bindings.elements.find(
      (element) => element.name.text === localName && !element.isTypeOnly
    );
    if (match) {
      return {
        moduleSpecifier: statement.moduleSpecifier.text,
        exportName: match.propertyName?.text ?? match.name.text,
      };
    }
  }
  return undefined;
}

function findLocalDeclaration(
  source: ts.SourceFile,
  name: string
): ts.Node | undefined {
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      return statement;
    }
    if (ts.isClassDeclaration(statement) && statement.name?.text === name) {
      return statement;
    }
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      (item) => ts.isIdentifier(item.name) && item.name.text === name
    );
    if (declaration) return declaration;
  }
  return undefined;
}

function exportedDeclaration(
  source: ts.SourceFile,
  name: string
): ts.Node | undefined {
  if (name === "default") {
    const assignment = source.statements.find(
      (statement): statement is ts.ExportAssignment =>
        ts.isExportAssignment(statement) && !statement.isExportEquals
    );
    if (assignment) return assignment.expression;
  }
  for (const statement of source.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      (name === "default"
        ? hasDefaultModifier(statement)
        : statement.name?.text === name) &&
      (hasExportModifier(statement) || hasDefaultModifier(statement))
    ) {
      return statement;
    }
    if (
      ts.isClassDeclaration(statement) &&
      (name === "default"
        ? hasDefaultModifier(statement)
        : statement.name?.text === name) &&
      (hasExportModifier(statement) || hasDefaultModifier(statement))
    ) {
      return statement;
    }
    if (!ts.isVariableStatement(statement)) continue;
    if (!hasExportModifier(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      (item) => ts.isIdentifier(item.name) && item.name.text === name
    );
    if (declaration) return declaration;
  }
  return undefined;
}

function hasExportModifier(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function hasDefaultModifier(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = ts.canHaveModifiers(node)
    ? ts.getModifiers(node)
    : undefined;
  return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function staticPropertyName(expression: ts.Expression): string | undefined {
  const value = unwrapExpression(expression);
  if (ts.isPropertyAccessExpression(value)) return value.name.text;
  if (
    ts.isElementAccessExpression(value) &&
    value.argumentExpression &&
    ts.isStringLiteralLike(value.argumentExpression)
  ) {
    return value.argumentExpression.text;
  }
  return undefined;
}

function getObjectProperty(
  node: ts.Node,
  name: string
): ts.Expression | undefined {
  let value: ts.Node = node;
  if (ts.isVariableDeclaration(value) && value.initializer) {
    value = unwrapExpression(value.initializer);
  }
  if (!ts.isObjectLiteralExpression(value)) return undefined;
  for (const property of value.properties) {
    if (ts.isPropertyAssignment(property)) {
      if (propertyNameText(property.name) === name) return property.initializer;
    } else if (
      ts.isShorthandPropertyAssignment(property) &&
      property.name.text === name
    ) {
      return property.name;
    }
  }
  return undefined;
}

export function resolveComponentExpression(
  expression: ts.Expression,
  file: string,
  context: ComponentResolverContext,
  seen: ReadonlySet<string> = new Set()
): SourceNode[] {
  const value = unwrapExpression(expression);
  if (ts.isIdentifier(value)) {
    const key = `${file}#${value.text}`;
    if (seen.has(key)) return [];
    const nextSeen = new Set(seen).add(key);
    const source = context.sourceFiles.get(file);
    if (!source) return [];
    const binding = namedImportBinding(source, value.text);
    if (binding) {
      if (binding.exportName === null) return [];
      const target = resolveSkinPackagePath(
        file,
        binding.moduleSpecifier,
        context.packageFiles,
        context.skin
      );
      return target
        ? resolveExportedComponent(
            target,
            binding.exportName,
            context,
            nextSeen
          )
        : [];
    }
    const declaration = findLocalDeclaration(source, value.text);
    if (!declaration) return [];
    if (ts.isFunctionDeclaration(declaration)) {
      return [{ file, node: declaration }];
    }
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      return resolveComponentExpression(
        declaration.initializer,
        file,
        context,
        nextSeen
      );
    }
    return [];
  }

  if (
    ts.isPropertyAccessExpression(value) ||
    ts.isElementAccessExpression(value)
  ) {
    const propertyName = staticPropertyName(value);
    if (!propertyName) return [];
    if (ts.isIdentifier(value.expression)) {
      const source = context.sourceFiles.get(file);
      const binding =
        source && namedImportBinding(source, value.expression.text);
      if (binding?.exportName === null) {
        const target = resolveSkinPackagePath(
          file,
          binding.moduleSpecifier,
          context.packageFiles,
          context.skin
        );
        return target
          ? resolveExportedComponent(target, propertyName, context, seen)
          : [];
      }
    }
    for (const base of resolveComponentExpression(
      value.expression,
      file,
      context,
      seen
    )) {
      const property = getObjectProperty(base.node, propertyName);
      if (property) {
        return resolveComponentExpression(property, base.file, context, seen);
      }
    }
    return [];
  }

  if (
    ts.isArrowFunction(value) ||
    ts.isFunctionExpression(value) ||
    ts.isCallExpression(value) ||
    ts.isFunctionDeclaration(value) ||
    ts.isObjectLiteralExpression(value)
  ) {
    return [{ file, node: value }];
  }
  return [];
}

function resolveExportedComponent(
  file: string,
  exportName: string,
  context: ComponentResolverContext,
  seen: ReadonlySet<string>
): SourceNode[] {
  const key = `${file}#export:${exportName}`;
  if (seen.has(key)) return [];
  const nextSeen = new Set(seen).add(key);
  const source = context.sourceFiles.get(file);
  if (!source) return [];

  const direct = exportedDeclaration(source, exportName);
  if (direct) {
    if (ts.isVariableDeclaration(direct) && direct.initializer) {
      return resolveComponentExpression(
        direct.initializer,
        file,
        context,
        nextSeen
      );
    }
    if (ts.isExpression(direct)) {
      return resolveComponentExpression(direct, file, context, nextSeen);
    }
    return [{ file, node: direct }];
  }

  for (const statement of source.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause) continue;
    if (!ts.isNamedExports(statement.exportClause)) continue;
    const match = statement.exportClause.elements.find(
      (element) => element.name.text === exportName && !element.isTypeOnly
    );
    if (!match) continue;
    const importedName = match.propertyName?.text ?? match.name.text;
    if (
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const target = resolveSkinPackagePath(
        file,
        statement.moduleSpecifier.text,
        context.packageFiles,
        context.skin
      );
      return target
        ? resolveExportedComponent(target, importedName, context, nextSeen)
        : [];
    }
    return resolveComponentExpression(
      ts.factory.createIdentifier(importedName),
      file,
      context,
      nextSeen
    );
  }

  for (const statement of source.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.exportClause ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    if (exportName === "default") continue;
    const target = resolveSkinPackagePath(
      file,
      statement.moduleSpecifier.text,
      context.packageFiles,
      context.skin
    );
    const result = target
      ? resolveExportedComponent(target, exportName, context, nextSeen)
      : [];
    if (result.length > 0) return result;
  }
  return [];
}
