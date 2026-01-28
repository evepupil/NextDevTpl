/**
 * Storage 存储安全集成测试
 *
 * 测试范围：
 * - Bucket 白名单验证
 * - 用户文件隔离（只能操作自己的文件）
 * - 文件键名合法性验证
 * - ContentType 验证
 *
 * 注意：这些测试验证安全逻辑，不实际调用 S3
 */

import { afterAll, describe, expect, it } from "vitest";

import { cleanupTestUsers, createTestUser } from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 模拟存储安全检查逻辑
// (从 storage/actions.ts 提取核心验证逻辑)
// ============================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

/**
 * 获取允许的存储桶白名单
 */
function getAllowedBuckets(): string[] {
	// 在测试中，我们使用固定的白名单
	return ["test-avatars-bucket", "nextdevkit-avatars"];
}

/**
 * 验证存储桶是否在白名单中
 */
function validateBucket(bucket: string): boolean {
	const allowedBuckets = getAllowedBuckets();
	return allowedBuckets.includes(bucket);
}

/**
 * 验证文件键名是否包含用户 ID
 */
function validateUserOwnership(key: string, userId: string): boolean {
	return key.includes(userId);
}

/**
 * 验证文件键名格式
 *
 * 安全检查:
 * - 只允许字母、数字、连字符、下划线、斜杠、点
 * - 禁止路径遍历 (..)
 * - 长度限制 1-255
 */
function validateKeyFormat(key: string): boolean {
	// 检查路径遍历攻击
	if (key.includes("..")) {
		return false;
	}

	const keyRegex = /^[a-zA-Z0-9\-_\/\.]+$/;
	return keyRegex.test(key) && key.length >= 1 && key.length <= 255;
}

/**
 * 验证 ContentType
 */
function validateContentType(contentType: string): boolean {
	return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

/**
 * 完整验证上传请求
 */
function validateUploadRequest(params: {
	key: string;
	bucket: string;
	contentType: string;
	userId: string;
}): { valid: boolean; error?: string } {
	const { key, bucket, contentType, userId } = params;

	// 验证存储桶白名单
	if (!validateBucket(bucket)) {
		return { valid: false, error: "不允许访问该存储桶" };
	}

	// 验证用户文件隔离
	if (!validateUserOwnership(key, userId)) {
		return { valid: false, error: "文件路径无效：必须包含用户 ID" };
	}

	// 验证键名格式
	if (!validateKeyFormat(key)) {
		return { valid: false, error: "文件键名包含非法字符或长度不符" };
	}

	// 验证 ContentType
	if (!validateContentType(contentType)) {
		return { valid: false, error: `只支持以下文件类型: ${ALLOWED_IMAGE_TYPES.join(", ")}` };
	}

	return { valid: true };
}

/**
 * 完整验证删除请求
 */
function validateDeleteRequest(params: {
	key: string;
	bucket: string;
	userId: string;
}): { valid: boolean; error?: string } {
	const { key, bucket, userId } = params;

	// 验证存储桶白名单
	if (!validateBucket(bucket)) {
		return { valid: false, error: "不允许访问该存储桶" };
	}

	// 验证用户文件隔离
	if (!validateUserOwnership(key, userId)) {
		return { valid: false, error: "无权删除此文件" };
	}

	return { valid: true };
}

// ============================================
// Bucket 白名单测试
// ============================================

describe("Storage Bucket Whitelist", () => {
	it("应该允许白名单内的存储桶", () => {
		expect(validateBucket("test-avatars-bucket")).toBe(true);
		expect(validateBucket("nextdevkit-avatars")).toBe(true);
	});

	it("应该拒绝不在白名单内的存储桶", () => {
		expect(validateBucket("malicious-bucket")).toBe(false);
		expect(validateBucket("other-bucket")).toBe(false);
		expect(validateBucket("")).toBe(false);
		expect(validateBucket("production-data")).toBe(false);
	});

	it("上传请求应该拒绝非白名单存储桶", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateUploadRequest({
			key: `avatars/${testUser.id}/avatar.jpg`,
			bucket: "malicious-bucket",
			contentType: "image/jpeg",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
		expect(result.error).toContain("不允许访问该存储桶");
	});

	it("删除请求应该拒绝非白名单存储桶", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateDeleteRequest({
			key: `avatars/${testUser.id}/avatar.jpg`,
			bucket: "malicious-bucket",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
		expect(result.error).toContain("不允许访问该存储桶");
	});
});

// ============================================
// 用户文件隔离测试
// ============================================

describe("Storage User Isolation", () => {
	it("用户应该能操作包含自己 ID 的文件", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const key = `avatars/${testUser.id}/profile.jpg`;
		expect(validateUserOwnership(key, testUser.id)).toBe(true);
	});

	it("用户不应该能操作其他用户的文件", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		createdUserIds.push(user1.id, user2.id);

		const keyBelongsToUser2 = `avatars/${user2.id}/profile.jpg`;
		expect(validateUserOwnership(keyBelongsToUser2, user1.id)).toBe(false);
	});

	it("上传请求应该拒绝不包含用户 ID 的路径", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateUploadRequest({
			key: "avatars/other-user-123/avatar.jpg",
			bucket: "test-avatars-bucket",
			contentType: "image/jpeg",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
		expect(result.error).toContain("必须包含用户 ID");
	});

	it("删除请求应该拒绝不属于用户的文件", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateDeleteRequest({
			key: "avatars/other-user-456/profile.jpg",
			bucket: "test-avatars-bucket",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
		expect(result.error).toContain("无权删除此文件");
	});

	it("用户 ID 可以出现在路径的任意位置", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// ID 在路径中间
		expect(validateUserOwnership(`avatars/${testUser.id}/photo.jpg`, testUser.id)).toBe(true);
		// ID 在文件名中
		expect(validateUserOwnership(`avatars/photo-${testUser.id}.jpg`, testUser.id)).toBe(true);
		// ID 在开头
		expect(validateUserOwnership(`${testUser.id}/avatars/photo.jpg`, testUser.id)).toBe(true);
	});
});

// ============================================
// 文件键名验证测试
// ============================================

describe("Storage Key Validation", () => {
	it("应该接受合法的文件键名", () => {
		expect(validateKeyFormat("avatars/user-123/photo.jpg")).toBe(true);
		expect(validateKeyFormat("a.jpg")).toBe(true);
		expect(validateKeyFormat("folder/subfolder/file_name-2.png")).toBe(true);
		expect(validateKeyFormat("123/456/789.gif")).toBe(true);
	});

	it("应该拒绝包含非法字符的键名", () => {
		expect(validateKeyFormat("avatars/../secret.jpg")).toBe(false); // 包含 ..
		expect(validateKeyFormat("avatars/photo name.jpg")).toBe(false); // 包含空格
		expect(validateKeyFormat("avatars/文件.jpg")).toBe(false); // 包含中文
		expect(validateKeyFormat("avatars/photo@2x.jpg")).toBe(false); // 包含 @
		expect(validateKeyFormat("avatars/photo#1.jpg")).toBe(false); // 包含 #
	});

	it("应该拒绝空键名", () => {
		expect(validateKeyFormat("")).toBe(false);
	});

	it("应该拒绝过长的键名", () => {
		const longKey = "a".repeat(256);
		expect(validateKeyFormat(longKey)).toBe(false);

		const maxLengthKey = "a".repeat(255);
		expect(validateKeyFormat(maxLengthKey)).toBe(true);
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

	it("上传请求应该拒绝不支持的 ContentType", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateUploadRequest({
			key: `avatars/${testUser.id}/file.pdf`,
			bucket: "test-avatars-bucket",
			contentType: "application/pdf",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
		expect(result.error).toContain("只支持以下文件类型");
	});
});

// ============================================
// 完整验证流程测试
// ============================================

describe("Storage Full Validation", () => {
	it("合法的上传请求应该通过验证", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateUploadRequest({
			key: `avatars/${testUser.id}/profile.jpg`,
			bucket: "test-avatars-bucket",
			contentType: "image/jpeg",
			userId: testUser.id,
		});

		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("合法的删除请求应该通过验证", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = validateDeleteRequest({
			key: `avatars/${testUser.id}/old-avatar.png`,
			bucket: "test-avatars-bucket",
			userId: testUser.id,
		});

		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("应该按顺序检查所有验证条件", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 同时违反多个条件，应该返回第一个错误（bucket）
		const result1 = validateUploadRequest({
			key: "avatars/other-user/photo.svg",
			bucket: "malicious-bucket",
			contentType: "image/svg+xml",
			userId: testUser.id,
		});
		expect(result1.error).toContain("不允许访问该存储桶");

		// bucket 正确，但 userId 不匹配
		const result2 = validateUploadRequest({
			key: "avatars/other-user/photo.svg",
			bucket: "test-avatars-bucket",
			contentType: "image/svg+xml",
			userId: testUser.id,
		});
		expect(result2.error).toContain("必须包含用户 ID");
	});
});

// ============================================
// 安全攻击向量测试
// ============================================

describe("Storage Security Attack Vectors", () => {
	it("应该防止路径遍历攻击", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 尝试使用 .. 遍历目录
		expect(validateKeyFormat(`avatars/${testUser.id}/../../../etc/passwd`)).toBe(false);
		expect(validateKeyFormat(`../${testUser.id}/secret`)).toBe(false);
	});

	it("应该防止 bucket 名称注入", () => {
		// 尝试使用特殊字符或相似名称
		expect(validateBucket("test-avatars-bucket; rm -rf /")).toBe(false);
		expect(validateBucket("test-avatars-bucket\nmalicious")).toBe(false);
		expect(validateBucket("test-avatars-bucket-fake")).toBe(false);
	});

	it("应该防止 MIME 类型欺骗", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 文件扩展名是 .jpg 但 MIME 类型是脚本
		const result = validateUploadRequest({
			key: `avatars/${testUser.id}/malicious.jpg`,
			bucket: "test-avatars-bucket",
			contentType: "application/javascript",
			userId: testUser.id,
		});

		expect(result.valid).toBe(false);
	});

	it("应该防止用户 ID 伪造", async () => {
		const attacker = await createTestUser();
		const victim = await createTestUser();
		createdUserIds.push(attacker.id, victim.id);

		// 攻击者尝试操作受害者的文件
		const uploadResult = validateUploadRequest({
			key: `avatars/${victim.id}/avatar.jpg`,
			bucket: "test-avatars-bucket",
			contentType: "image/jpeg",
			userId: attacker.id, // 攻击者的真实 userId
		});

		expect(uploadResult.valid).toBe(false);
		expect(uploadResult.error).toContain("必须包含用户 ID");

		const deleteResult = validateDeleteRequest({
			key: `avatars/${victim.id}/avatar.jpg`,
			bucket: "test-avatars-bucket",
			userId: attacker.id,
		});

		expect(deleteResult.valid).toBe(false);
		expect(deleteResult.error).toContain("无权删除此文件");
	});
});
