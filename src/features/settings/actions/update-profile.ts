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
 * - 更新数据库中的用户名称和头像
 * - 刷新设置页面缓存
 *
 * @param data - 包含 name 和/或 image 字段的对象
 * @returns 成功消息
 */
export const updateProfileAction = protectedAction
  .metadata({ action: "settings.updateProfile" })
  .schema(updateProfileSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 构建更新对象
    const updateData: { name?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    // 如果提供了 name，添加到更新对象
    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    // 如果提供了 image，添加到更新对象
    if (data.image !== undefined) {
      updateData.image = data.image;
    }

    // 使用 Drizzle 更新用户资料
    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, ctx.userId));

    // 刷新设置页面缓存，使 UI 更新
    revalidatePath("/dashboard/settings");

    return {
      message: "资料更新成功",
    };
  });
