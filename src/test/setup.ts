/**
 * Vitest 全局 Setup
 *
 * 在所有测试运行前执行
 */

import { beforeAll, afterAll } from "vitest";
import { testDb, closeTestDb } from "./utils/db";

// 验证测试环境
beforeAll(async () => {
	// 确保使用测试数据库
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		throw new Error(
			"DATABASE_URL 未设置。请创建 .env.test 文件并设置测试数据库连接。"
		);
	}

	// 安全检查：确保不是生产数据库
	if (
		!dbUrl.includes("test") &&
		!dbUrl.includes("dev") &&
		!dbUrl.includes("branch")
	) {
		console.warn(
			"⚠️  警告: DATABASE_URL 不包含 'test', 'dev' 或 'branch'。" +
				"请确保这是测试数据库！"
		);
	}

	console.log("🧪 测试数据库已连接");
});

// 所有测试完成后关闭连接
afterAll(async () => {
	await closeTestDb();
	console.log("🧪 测试数据库连接已关闭");
});

// 导出测试数据库实例供全局使用
export { testDb };
