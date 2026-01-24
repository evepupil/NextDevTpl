import { z } from "zod";

/**
 * 更新用户资料的 Zod Schema
 *
 * @field name - 用户显示名称，最少 2 个字符，最多 50 个字符
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "名称至少需要 2 个字符")
    .max(50, "名称最多 50 个字符"),
});

/**
 * 表单数据类型，从 Zod Schema 推断
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
