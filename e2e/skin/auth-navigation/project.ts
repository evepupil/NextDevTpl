import fs from "node:fs";
import path from "node:path";

import * as ts from "typescript";

import { skinAcceptanceProject } from "../project";

export interface AuthNavigation {
  afterSignIn: string | null;
  afterSignOut: string;
}

export interface AuthNavigationProject {
  authNavigation: AuthNavigation | null;
  directory: string;
  modules: readonly string[];
}

function propertyName(name: ts.PropertyName | undefined): string | undefined {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return undefined;
}

function stringOrNull(node: ts.Expression | undefined): string | null {
  if (!node) throw new Error("认证去向配置缺少字段值。");
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error("认证去向配置字段必须是字符串或 null。");
}

function readAuthNavigation(directory: string): AuthNavigation {
  const filePath = path.join(directory, "src", "config", "auth-navigation.ts");
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== "authNavigation" ||
        !declaration.initializer ||
        !ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        continue;
      }

      const values = new Map<string, ts.Expression>();
      for (const property of declaration.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = propertyName(property.name);
        if (name) values.set(name, property.initializer);
      }
      const afterSignIn = stringOrNull(values.get("afterSignIn"));
      const afterSignOut = stringOrNull(values.get("afterSignOut"));
      if (afterSignOut === null) {
        throw new Error("生成项目的退出去向不能为 null。");
      }
      return { afterSignIn, afterSignOut };
    }
  }
  throw new Error("生成项目缺少 authNavigation 配置对象。");
}

export function authNavigationProject(
  repositoryRoot: string
): AuthNavigationProject {
  const selected = skinAcceptanceProject(repositoryRoot);
  return {
    authNavigation: selected.modules.includes("auth")
      ? readAuthNavigation(selected.directory)
      : null,
    directory: selected.directory,
    modules: selected.modules,
  };
}

export function assertProductionBuild(directory: string): void {
  const nextDirectory = path.join(directory, ".next");
  const buildId = path.join(nextDirectory, "BUILD_ID");
  const nextStat = fs.lstatSync(nextDirectory, { throwIfNoEntry: false });
  const buildStat = fs.lstatSync(buildId, { throwIfNoEntry: false });
  if (
    !nextStat?.isDirectory() ||
    nextStat.isSymbolicLink() ||
    !buildStat?.isFile() ||
    buildStat.isSymbolicLink() ||
    !fs.readFileSync(buildId, "utf8").trim()
  ) {
    throw new Error(
      `生成项目还没有可用的生产构建：${directory}。请先在隔离项目中完成生产构建。`
    );
  }
  try {
    require.resolve("next/dist/bin/next", { paths: [directory] });
  } catch {
    throw new Error(`生成项目缺少 Next.js 运行依赖：${directory}。`);
  }
}
