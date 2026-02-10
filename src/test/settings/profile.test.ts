/**
 * 用户资料更新集成测试
 *
 * 测试范围：
 * - 更新用户名称
 * - 更新用户头像
 * - 部分更新（只更新 name 或 image）
 * - 输入验证（Schema 验证）
 * - updatedAt 时间戳更新
 *
 * 注意：这些测试验证数据库操作逻辑，不测试 Next.js cache revalidation
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { user } from "@/db/schema";
import { cleanupTestUsers, createTestUser, testDb } from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 模拟 updateProfileAction 的核心逻辑
// (从 features/settings/actions/update-profile.ts 提取)
// ============================================

interface UpdateProfileData {
	name?: string;
	image?: string;
}

/**
 * 更新用户资料（模拟 Server Action 逻辑）
 */
async function updateProfile(userId: string, data: UpdateProfileData) {
	// 验证输入
	if (data.name !== undefined) {
		if (data.name.length < 2) {
			throw new Error("名称至少需要 2 个字符");
		}
		if (data.name.length > 50) {
			throw new Error("名称最多 50 个字符");
		}
	}

	if (data.image !== undefined) {
		if (data.image.length > 255) {
			throw new Error("头像路径过长");
		}
	}

	// 构建更新对象
	const updateData: { name?: string; image?: string; updatedAt: Date } = {
		updatedAt: new Date(),
	};

	if (data.name !== undefined) {
		updateData.name = data.name;
	}

	if (data.image !== undefined) {
		updateData.image = data.image;
	}

	// 更新数据库
	await testDb
		.update(user)
		.set(updateData)
		.where(eq(user.id, userId));

	return { message: "资料更新成功" };
}

/**
 * 获取用户资料
 */
async function getUserProfile(userId: string) {
	const [result] = await testDb
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
			email: user.email,
			updatedAt: user.updatedAt,
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	return result;
}

// ============================================
// 更新名称测试
// ============================================

describe("Profile Update - Name", () => {
	it("应该成功更新用户名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const newName = "新用户名称";
		const result = await updateProfile(testUser.id, { name: newName });

		expect(result.message).toBe("资料更新成功");

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(newName);
	});

	it("应该允许最短 2 个字符的名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			updateProfile(testUser.id, { name: "AB" })
		).resolves.not.toThrow();

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe("AB");
	});

	it("应该允许最长 50 个字符的名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const longName = "A".repeat(50);
		await expect(
			updateProfile(testUser.id, { name: longName })
		).resolves.not.toThrow();

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(longName);
	});

	it("应该拒绝少于 2 个字符的名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			updateProfile(testUser.id, { name: "A" })
		).rejects.toThrow("名称至少需要 2 个字符");
	});

	it("应该拒绝超过 50 个字符的名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const tooLongName = "A".repeat(51);
		await expect(
			updateProfile(testUser.id, { name: tooLongName })
		).rejects.toThrow("名称最多 50 个字符");
	});

	it("应该支持中文名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const chineseName = "测试用户";
		await updateProfile(testUser.id, { name: chineseName });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(chineseName);
	});

	it("应该支持特殊字符的名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const specialName = "User-Name_123 (Test)";
		await updateProfile(testUser.id, { name: specialName });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(specialName);
	});
});

// ============================================
// 更新头像测试
// ============================================

describe("Profile Update - Image", () => {
	it("应该成功更新用户头像", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const newImage = "avatars/test-user/profile.jpg";
		await updateProfile(testUser.id, { image: newImage });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe(newImage);
	});

	it("应该允许空字符串的头像（清除头像）", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先设置头像
		await updateProfile(testUser.id, { image: "avatars/test.jpg" });

		// 再清除头像
		await updateProfile(testUser.id, { image: "" });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe("");
	});

	it("应该允许最长 255 个字符的头像路径", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const longPath = "avatars/" + "a".repeat(247); // 255 characters total
		await expect(
			updateProfile(testUser.id, { image: longPath })
		).resolves.not.toThrow();

		const profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe(longPath);
	});

	it("应该拒绝超过 255 个字符的头像路径", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const tooLongPath = "avatars/" + "a".repeat(250); // 258 characters
		await expect(
			updateProfile(testUser.id, { image: tooLongPath })
		).rejects.toThrow("头像路径过长");
	});

	it("应该支持 URL 格式的头像路径", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const imageUrl = "https://example.com/avatars/user123.jpg";
		await updateProfile(testUser.id, { image: imageUrl });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe(imageUrl);
	});
});

// ============================================
// 部分更新测试
// ============================================

describe("Profile Update - Partial Updates", () => {
	it("只更新名称不应影响头像", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先设置头像
		const originalImage = "avatars/original.jpg";
		await updateProfile(testUser.id, { image: originalImage });

		// 只更新名称
		await updateProfile(testUser.id, { name: "新名称" });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe("新名称");
		expect(profile!.image).toBe(originalImage);
	});

	it("只更新头像不应影响名称", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先设置名称
		const originalName = "原始名称";
		await updateProfile(testUser.id, { name: originalName });

		// 只更新头像
		await updateProfile(testUser.id, { image: "avatars/new.jpg" });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(originalName);
		expect(profile!.image).toBe("avatars/new.jpg");
	});

	it("同时更新名称和头像", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const newName = "同时更新";
		const newImage = "avatars/both.jpg";

		await updateProfile(testUser.id, {
			name: newName,
			image: newImage,
		});

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(newName);
		expect(profile!.image).toBe(newImage);
	});

	it("空对象更新不应改变用户数据（只更新 updatedAt）", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先设置初始值
		await updateProfile(testUser.id, {
			name: "初始名称",
			image: "avatars/initial.jpg",
		});

		const profileBefore = await getUserProfile(testUser.id);

		// 等待一小段时间
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 空对象更新
		await updateProfile(testUser.id, {});

		const profileAfter = await getUserProfile(testUser.id);

		// 名称和头像应该不变
		expect(profileAfter!.name).toBe(profileBefore!.name);
		expect(profileAfter!.image).toBe(profileBefore!.image);

		// updatedAt 应该更新
		expect(profileAfter!.updatedAt!.getTime()).toBeGreaterThan(
			profileBefore!.updatedAt!.getTime()
		);
	});
});

// ============================================
// updatedAt 时间戳测试
// ============================================

describe("Profile Update - Timestamp", () => {
	it("更新操作应该更新 updatedAt", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const profileBefore = await getUserProfile(testUser.id);
		const updatedAtBefore = profileBefore!.updatedAt;

		// 等待一小段时间
		await new Promise((resolve) => setTimeout(resolve, 10));

		await updateProfile(testUser.id, { name: "新名称" });

		const profileAfter = await getUserProfile(testUser.id);
		const updatedAtAfter = profileAfter!.updatedAt;

		expect(updatedAtAfter!.getTime()).toBeGreaterThan(updatedAtBefore!.getTime());
	});

	it("多次更新应该持续更新 updatedAt", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const timestamps: number[] = [];

		for (let i = 0; i < 3; i++) {
			await updateProfile(testUser.id, { name: `名称 ${i}` });
			const profile = await getUserProfile(testUser.id);
			timestamps.push(profile!.updatedAt!.getTime());

			// 等待一小段时间
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		// 验证时间戳递增
		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]!);
		}
	});
});

// ============================================
// 边界情况测试
// ============================================

describe("Profile Update - Edge Cases", () => {
	it("更新不存在的用户不应报错（静默失败）", async () => {
		// 尝试更新不存在的用户
		// 这不会抛出错误，只是 UPDATE 语句不会影响任何行
		await expect(
			updateProfile("nonexistent_user_12345", { name: "测试" })
		).resolves.not.toThrow();
	});

	it("应该正确处理 null 相关值", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 设置头像为空字符串（不是 null）
		await updateProfile(testUser.id, { image: "" });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe("");
	});

	it("应该正确处理 Unicode 表情符号", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const nameWithEmoji = "用户 🎉 测试";
		await updateProfile(testUser.id, { name: nameWithEmoji });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(nameWithEmoji);
	});

	it("应该正确处理换行符", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const nameWithNewline = "用户名称\n测试";
		await updateProfile(testUser.id, { name: nameWithNewline });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(nameWithNewline);
	});

	it("应该保留名称中的空格", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const nameWithSpaces = "  测试 用户  ";
		await updateProfile(testUser.id, { name: nameWithSpaces });

		const profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe(nameWithSpaces);
	});
});

// ============================================
// 完整流程测试
// ============================================

describe("Profile Update - Full Lifecycle", () => {
	it("完整资料更新生命周期", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 1. 初始状态
		let profile = await getUserProfile(testUser.id);
		expect(profile).toBeDefined(); // 验证用户存在

		// 2. 更新名称
		await updateProfile(testUser.id, { name: "第一次更新" });
		profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe("第一次更新");

		// 3. 更新头像
		await updateProfile(testUser.id, { image: "avatars/first.jpg" });
		profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe("avatars/first.jpg");
		expect(profile!.name).toBe("第一次更新"); // 名称不变

		// 4. 同时更新
		await updateProfile(testUser.id, {
			name: "最终名称",
			image: "avatars/final.jpg",
		});
		profile = await getUserProfile(testUser.id);
		expect(profile!.name).toBe("最终名称");
		expect(profile!.image).toBe("avatars/final.jpg");

		// 5. 清除头像
		await updateProfile(testUser.id, { image: "" });
		profile = await getUserProfile(testUser.id);
		expect(profile!.image).toBe("");
		expect(profile!.name).toBe("最终名称"); // 名称不变
	});
});
