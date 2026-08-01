import { describe, expect, it } from "vitest";

import {
  MAX_DOCUMENT_UPLOAD_SIZE,
  validateDocumentUploadRequest,
} from "@/lib/file-utils";

describe("validateDocumentUploadRequest", () => {
  const validRequest = {
    filename: "notes.md",
    contentType: "text/markdown",
    fileSize: 1024,
  };

  it("accepts a valid request at the size boundary", () => {
    expect(
      validateDocumentUploadRequest({
        ...validRequest,
        fileSize: MAX_DOCUMENT_UPLOAD_SIZE,
      })
    ).toEqual({
      success: true,
      data: { ...validRequest, fileSize: MAX_DOCUMENT_UPLOAD_SIZE },
    });
  });

  it.each([
    -1,
    0,
    1.5,
    Number.NaN,
    MAX_DOCUMENT_UPLOAD_SIZE + 1,
  ])("rejects an invalid file size: %s", (fileSize) => {
    expect(
      validateDocumentUploadRequest({ ...validRequest, fileSize })
    ).toEqual({ success: false, reason: "invalid_request" });
  });

  it("rejects an extension and MIME type mismatch", () => {
    expect(
      validateDocumentUploadRequest({
        ...validRequest,
        filename: "notes.pdf",
      })
    ).toEqual({ success: false, reason: "unsupported_type" });
  });

  it("rejects malformed request bodies", () => {
    expect(validateDocumentUploadRequest(null)).toEqual({
      success: false,
      reason: "invalid_request",
    });
  });
});
