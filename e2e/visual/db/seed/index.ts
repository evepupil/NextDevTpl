/**
 * 截图数据库的固定种子数据
 *
 * 所有 ID 和时间都写死，没有随机值，也不读当前时间：同一份代码每次写进去的数据完全一样，
 * 页面上才不会因为种子不同而出现差异。
 */

import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

import * as schema from "../../../../src/db/schema/index";
import { seedBilling } from "./billing";
import { seedCredits } from "./credits";
import { seedIdentity } from "./identity";
import { seedSupport } from "./support";

/** 在一个事务里写入全部种子，任何一步失败都整体回滚 */
export async function seedDatabase(pool: Pool): Promise<void> {
  const database = drizzle(pool, { schema });
  await database.transaction(async (tx) => {
    await seedIdentity(tx);
    await seedBilling(tx);
    await seedCredits(tx);
    await seedSupport(tx);
  });
}
