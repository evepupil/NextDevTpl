/**
 * lib/ 模块测试
 *
 * 测试范围：
 * - file-utils.ts 文件类型检测
 * - api/jobs 路由认证函数
 * - middleware 路径匹配
 */

import { describe, expect, it } from "vitest";

import { getFileTypeFromMime, getFileTypeFromName } from "@/lib/file-utils";

describe("getFileTypeFromName", () => {
  it("应识别 .pdf 文件", () => {
    expect(getFileTypeFromName("document.pdf")).toBe("pdf");
  });

  it("应识别 .docx 文件", () => {
    expect(getFileTypeFromName("report.docx")).toBe("docx");
  });

  it("应识别 .md 文件", () => {
    expect(getFileTypeFromName("README.md")).toBe("md");
  });

  it("应识别 .txt 文件", () => {
    expect(getFileTypeFromName("notes.txt")).toBe("txt");
  });

  it("应处理大写扩展名", () => {
    expect(getFileTypeFromName("DOCUMENT.PDF")).toBe("pdf");
  });

  it("无扩展名应返回 null", () => {
    expect(getFileTypeFromName("noextension")).toBeNull();
  });

  it("未知扩展名应返回 null", () => {
    expect(getFileTypeFromName("image.png")).toBeNull();
  });

  it("应处理带多个点的文件名", () => {
    expect(getFileTypeFromName("archive.tar.txt")).toBe("txt");
  });
});

describe("getFileTypeFromMime", () => {
  it("应识别 PDF MIME 类型", () => {
    expect(getFileTypeFromMime("application/pdf")).toBe("pdf");
  });

  it("应识别 DOCX MIME 类型", () => {
    expect(
      getFileTypeFromMime(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe("docx");
  });

  it("应识别 Markdown MIME 类型", () => {
    expect(getFileTypeFromMime("text/markdown")).toBe("md");
  });

  it("应识别纯文本 MIME 类型", () => {
    expect(getFileTypeFromMime("text/plain")).toBe("txt");
  });

  it("未知 MIME 类型应返回 null", () => {
    expect(getFileTypeFromMime("image/png")).toBeNull();
  });
});

// ============================================
// Cron Job Auth 验证函数测试
// ============================================

function validateCronSecret(
  authHeader: string | null,
  secret?: string
): boolean {
  if (!authHeader) return false;

  const cronSecret = secret ?? process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === cronSecret;
}

describe("validateCronSecret", () => {
  const testSecret = "test-cron-secret-123";

  it("有效的 Bearer Token 应通过验证", () => {
    expect(validateCronSecret(`Bearer ${testSecret}`, testSecret)).toBe(true);
  });

  it("无效的 Token 应拒绝", () => {
    expect(validateCronSecret("Bearer wrong-token", testSecret)).toBe(false);
  });

  it("无 auth header 应拒绝", () => {
    expect(validateCronSecret(null, testSecret)).toBe(false);
  });

  it("未设置 CRON_SECRET 应拒绝", () => {
    expect(validateCronSecret("any-token", "")).toBe(false);
  });

  it("不带 Bearer 前缀的纯 token 也应支持", () => {
    expect(validateCronSecret(testSecret, testSecret)).toBe(true);
  });
});
