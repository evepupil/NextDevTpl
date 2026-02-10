import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// 加载测试环境变量
config({ path: ".env.test" });

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/test/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", ".next", "dist"],
		// 集成测试需要更长的超时时间
		testTimeout: 30000,
		hookTimeout: 30000,
		// 顺序执行测试，避免数据库竞争
		sequence: {
			concurrent: false,
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/features/**/*.ts"],
			exclude: [
				"node_modules/",
				".next/",
				"**/*.config.*",
				"**/*.d.ts",
				"**/components/**",
			],
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
