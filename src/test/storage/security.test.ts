/**
 * Storage 存储安全测试
 *
 * 测试范围：
 * - Bucket 白名单验证
 * - 用户文件隔离（锚定 userId 首路径段，非子串匹配）
 * - 文件键名合法性验证（含路径遍历防护）
 * - ContentType 验证
 *
 * 注意：本测试直接 import 生产代码 (@/features/storage/validation)，
 * 不再复制一份逻辑——确保测试与真实路由/Action 不会漂移。
 */

import { describe, expect, it } from "vitest";

import {
  isKeyOwnedByUser,
  validateBucket,
  validateContentType,
  validateDeleteRequest,
  validateKeyFormat,
  validateUploadRequest,
} from "@/features/storage/validation";

// 测试用白名单与用户（纯函数测试，无需访问数据库）
const ALLOWED_BUCKETS = ["test-avatars-bucket", "nextdevtpl-avatars"];
const USER_ID = "user_abc123";
const OTHER_ID = "user_xyz789";

// ============================================
// Bucket 白名单测试
// ============================================

describe("Storage Bucket Whitelist", () => {
  it("应该允许白名单内的存储桶", () => {
    expect(validateBucket("test-avatars-bucket", ALLOWED_BUCKETS)).toBe(true);
    expect(validateBucket("nextdevtpl-avatars", ALLOWED_BUCKETS)).toBe(true);
  });

  it("应该拒绝不在白名单内的存储桶", () => {
    expect(validateBucket("malicious-bucket", ALLOWED_BUCKETS)).toBe(false);
    expect(validateBucket("other-bucket", ALLOWED_BUCKETS)).toBe(false);
    expect(validateBucket("", ALLOWED_BUCKETS)).toBe(false);
    expect(validateBucket("production-data", ALLOWED_BUCKETS)).toBe(false);
  });

  it("上传请求应该拒绝非白名单存储桶", () => {
    const result = validateUploadRequest({
      key: `${USER_ID}/avatar.jpg`,
      bucket: "malicious-bucket",
      contentType: "image/jpeg",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("不允许访问该存储桶");
  });

  it("删除请求应该拒绝非白名单存储桶", () => {
    const result = validateDeleteRequest({
      key: `${USER_ID}/avatar.jpg`,
      bucket: "malicious-bucket",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("不允许访问该存储桶");
  });
});

// ============================================
// 用户文件隔离测试（锚定首路径段）
// ============================================

describe("Storage User Isolation", () => {
  it("userId 作为首路径段时应该通过", () => {
    expect(isKeyOwnedByUser(`${USER_ID}/profile.jpg`, USER_ID)).toBe(true);
    expect(isKeyOwnedByUser(`${USER_ID}/2024/photo.png`, USER_ID)).toBe(true);
  });

  it("应该拒绝其他用户前缀的文件", () => {
    expect(isKeyOwnedByUser(`${OTHER_ID}/profile.jpg`, USER_ID)).toBe(false);
  });

  it("应该拒绝子串伪造（userId 不在首路径段）", () => {
    // 旧实现 key.includes(userId) 会误判为 true，新实现必须拒绝
    expect(isKeyOwnedByUser(`evil/${USER_ID}/x.jpg`, USER_ID)).toBe(false);
    expect(isKeyOwnedByUser(`photo-${USER_ID}.jpg`, USER_ID)).toBe(false);
    expect(isKeyOwnedByUser(`${USER_ID}extra/x.jpg`, USER_ID)).toBe(false);
    expect(isKeyOwnedByUser(`x-${USER_ID}-y/x.jpg`, USER_ID)).toBe(false);
  });

  it("应该拒绝缺少文件段或空 userId 的键名", () => {
    expect(isKeyOwnedByUser(USER_ID, USER_ID)).toBe(false); // 没有后续文件段
    expect(isKeyOwnedByUser(`${USER_ID}/`, USER_ID)).toBe(false); // 空文件段
    expect(isKeyOwnedByUser(`${USER_ID}/x.jpg`, "")).toBe(false); // 空 userId
  });

  it("上传请求应该拒绝不以用户 ID 为前缀的路径", () => {
    const result = validateUploadRequest({
      key: `${OTHER_ID}/avatar.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "image/jpeg",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("必须以用户 ID 作为前缀");
  });

  it("删除请求应该拒绝不属于用户的文件", () => {
    const result = validateDeleteRequest({
      key: `${OTHER_ID}/profile.jpg`,
      bucket: "test-avatars-bucket",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("无权操作此文件");
  });
});

// ============================================
// 文件键名验证测试
// ============================================

describe("Storage Key Validation", () => {
  it("应该接受合法的文件键名", () => {
    expect(validateKeyFormat(`${USER_ID}/photo.jpg`)).toBe(true);
    expect(validateKeyFormat("a.jpg")).toBe(true);
    expect(validateKeyFormat("folder/subfolder/file_name-2.png")).toBe(true);
    expect(validateKeyFormat("123/456/789.gif")).toBe(true);
  });

  it("应该拒绝包含非法字符的键名", () => {
    expect(validateKeyFormat("avatars/photo name.jpg")).toBe(false); // 空格
    expect(validateKeyFormat("avatars/文件.jpg")).toBe(false); // 中文
    expect(validateKeyFormat("avatars/photo@2x.jpg")).toBe(false); // @
    expect(validateKeyFormat("avatars/photo#1.jpg")).toBe(false); // #
  });

  it("应该拒绝路径遍历与异常分隔符", () => {
    expect(validateKeyFormat("avatars/../secret.jpg")).toBe(false); // ..
    expect(validateKeyFormat(`${USER_ID}/../../etc/passwd`)).toBe(false); // ..
    expect(validateKeyFormat("/abc.jpg")).toBe(false); // 绝对路径
    expect(validateKeyFormat("abc/")).toBe(false); // 尾随斜杠
    expect(validateKeyFormat("a//b.jpg")).toBe(false); // 空路径段
  });

  it("应该拒绝空键名", () => {
    expect(validateKeyFormat("")).toBe(false);
  });

  it("应该拒绝过长的键名", () => {
    expect(validateKeyFormat("a".repeat(256))).toBe(false);
    expect(validateKeyFormat("a".repeat(255))).toBe(true);
  });
});

// ============================================
// ContentType 验证测试
// ============================================

describe("Storage ContentType Validation", () => {
  it("应该接受支持的图片类型", () => {
    expect(validateContentType("image/jpeg")).toBe(true);
    expect(validateContentType("image/png")).toBe(true);
    expect(validateContentType("image/gif")).toBe(true);
    expect(validateContentType("image/webp")).toBe(true);
  });

  it("应该拒绝不支持的文件类型", () => {
    expect(validateContentType("image/svg+xml")).toBe(false);
    expect(validateContentType("image/bmp")).toBe(false);
    expect(validateContentType("application/pdf")).toBe(false);
    expect(validateContentType("text/html")).toBe(false);
    expect(validateContentType("application/javascript")).toBe(false);
    expect(validateContentType("")).toBe(false);
  });

  it("上传请求应该拒绝不支持的 ContentType", () => {
    const result = validateUploadRequest({
      key: `${USER_ID}/file.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "application/pdf",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("只支持以下文件类型");
  });
});

// ============================================
// 完整验证流程测试
// ============================================

describe("Storage Full Validation", () => {
  it("合法的上传请求应该通过验证", () => {
    const result = validateUploadRequest({
      key: `${USER_ID}/profile.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "image/jpeg",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("合法的删除请求应该通过验证", () => {
    const result = validateDeleteRequest({
      key: `${USER_ID}/old-avatar.png`,
      bucket: "test-avatars-bucket",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("应该按顺序检查所有验证条件", () => {
    // 同时违反多个条件，应该返回第一个错误（bucket）
    const result1 = validateUploadRequest({
      key: `${OTHER_ID}/photo.svg`,
      bucket: "malicious-bucket",
      contentType: "image/svg+xml",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });
    expect(result1.error).toContain("不允许访问该存储桶");

    // bucket 正确，但 userId 不匹配
    const result2 = validateUploadRequest({
      key: `${OTHER_ID}/photo.svg`,
      bucket: "test-avatars-bucket",
      contentType: "image/svg+xml",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });
    expect(result2.error).toContain("必须以用户 ID 作为前缀");
  });
});

// ============================================
// 安全攻击向量测试
// ============================================

describe("Storage Security Attack Vectors", () => {
  it("应该防止路径遍历攻击", () => {
    // 关键：旧生产正则允许 '.'，'..' 会被放行；新实现显式拦截
    expect(validateKeyFormat(`${USER_ID}/../../../etc/passwd`)).toBe(false);
    expect(validateKeyFormat(`../${USER_ID}/secret`)).toBe(false);

    // 经完整上传校验时也应被拒绝
    const result = validateUploadRequest({
      key: `${USER_ID}/../${OTHER_ID}/avatar.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "image/jpeg",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("文件键名包含非法字符或长度不符");
  });

  it("应该防止 bucket 名称注入", () => {
    expect(
      validateBucket("test-avatars-bucket; rm -rf /", ALLOWED_BUCKETS)
    ).toBe(false);
    expect(
      validateBucket("test-avatars-bucket\nmalicious", ALLOWED_BUCKETS)
    ).toBe(false);
    expect(validateBucket("test-avatars-bucket-fake", ALLOWED_BUCKETS)).toBe(
      false
    );
  });

  it("应该防止 MIME 类型欺骗", () => {
    // 文件扩展名是 .jpg 但 MIME 类型是脚本
    const result = validateUploadRequest({
      key: `${USER_ID}/malicious.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "application/javascript",
      userId: USER_ID,
      allowedBuckets: ALLOWED_BUCKETS,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("只支持以下文件类型");
  });

  it("应该防止用户 ID 伪造（攻击者操作受害者文件）", () => {
    const attackerId = USER_ID;
    const victimId = OTHER_ID;

    const uploadResult = validateUploadRequest({
      key: `${victimId}/avatar.jpg`,
      bucket: "test-avatars-bucket",
      contentType: "image/jpeg",
      userId: attackerId, // 攻击者的真实 userId
      allowedBuckets: ALLOWED_BUCKETS,
    });
    expect(uploadResult.valid).toBe(false);
    expect(uploadResult.error).toContain("必须以用户 ID 作为前缀");

    const deleteResult = validateDeleteRequest({
      key: `${victimId}/avatar.jpg`,
      bucket: "test-avatars-bucket",
      userId: attackerId,
      allowedBuckets: ALLOWED_BUCKETS,
    });
    expect(deleteResult.valid).toBe(false);
    expect(deleteResult.error).toContain("无权操作此文件");
  });
});
