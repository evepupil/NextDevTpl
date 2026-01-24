"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db, user } from "@/db";
import { protectedAction } from "@/lib/safe-action";
import { updateProfileSchema } from "@/features/settings/schemas";

/**
 * 更新用户资料 Server Action
 *
 * 功能:
 * - 验证用户已登录 (通过 protectedAction 中间件)
 * - 更新数据库中的用户名称
 * - 刷新设置页面缓存
 *
 * @param data - 包含 name 字段的对象
 * @returns 成功消息
 */
export const updateProfileAction = protectedAction
  .schema(updateProfileSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 使用 Drizzle 更新用户名称
    await db
      .update(user)
      .set({
        name: data.name,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.userId));

    // 刷新设置页面缓存，使 UI 更新
    revalidatePath("/dashboard/settings");

    return {
      message: "资料更新成功",
    };
  });
