/**
 * Global Vitest setup.
 */

import { afterAll, beforeAll } from "vitest";

import { closeTestDb, syncLegacyTestSchema, testDb } from "./utils/db";

beforeAll(async () => {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		throw new Error(
			"DATABASE_URL is not configured. Create .env.test and point it to a test database."
		);
	}

	if (
		!dbUrl.includes("test") &&
		!dbUrl.includes("dev") &&
		!dbUrl.includes("branch")
	) {
		console.warn(
			"Warning: DATABASE_URL does not look like a test database connection."
		);
	}

	await syncLegacyTestSchema();
	console.log("Test database connected");
});

afterAll(async () => {
	await closeTestDb();
	console.log("Test database connection closed");
});

export { testDb };
