import { sql } from "drizzle-orm";

export async function probeDatabase(): Promise<void> {
  const { db } = await import("@/db");
  await db.execute(sql`SELECT 1`);
}
