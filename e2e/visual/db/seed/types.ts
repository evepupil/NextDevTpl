/**
 * 种子写入函数共用的类型和小工具
 */

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "../../../../src/db/schema/index";

export type SeedDatabase = NodePgDatabase<typeof schema>;

/** 种子在一个事务里写入，各模块拿到的是事务句柄，任何一步失败都会整体回滚 */
export type SeedTransaction = Parameters<
  Parameters<SeedDatabase["transaction"]>[0]
>[0];

/**
 * 把 UTC 时间字符串转成 Date
 *
 * 种子里的时间全部写成带 Z 的字符串，不依赖运行机器的时区，也不读取当前时间。
 */
export function at(iso: string): Date {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`种子里的时间无法解析：${iso}`);
  }
  return date;
}
