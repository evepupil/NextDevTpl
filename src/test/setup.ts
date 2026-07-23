/**
 * Global Vitest setup.
 */

import { afterAll, beforeAll } from "vitest";

import { closeTestDb, syncLegacyTestSchema, testDb } from "./utils/db";

const TEST_DATABASE_ATTEMPTS = 3;

async function connectTestDatabase(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= TEST_DATABASE_ATTEMPTS; attempt += 1) {
    try {
      await syncLegacyTestSchema();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < TEST_DATABASE_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
}

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

  await connectTestDatabase();
  console.log("Test database connected");
});

afterAll(async () => {
  await closeTestDb();
  console.log("Test database connection closed");
});

export { testDb };
