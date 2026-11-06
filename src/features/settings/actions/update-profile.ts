"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { updateProfileSchema } from "@/features/settings/schemas";
import { auth } from "@/lib/auth";
import { protectedAction } from "@/lib/safe-action";

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
  .action(async ({ parsedInput: data }) => {
    const body = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    };

    if (Object.keys(body).length > 0) {
      await auth.api.updateUser({
        headers: await headers(),
        body,
      });
    }

    // 刷新设置页面缓存，使 UI 更新
    revalidatePath("/dashboard/settings");

    return {
      message: "资料更新成功",
    };
  });
