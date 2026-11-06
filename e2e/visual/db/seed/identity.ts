/**
 * 种子：账号
 *
 * - 截图用户：已验证邮箱、无头像、带邮箱密码登录凭证
 * - 客服：管理员角色，只在工单回复里出现，不需要能登录
 */

import { hashPassword } from "better-auth/crypto";

import { account, user } from "../../../../src/db/schema/index";
import { VISUAL_SUPPORT_AGENT, VISUAL_USER } from "../../constants";
import { VISUAL_PROVIDER } from "../../fixtures";
import { at, type SeedTransaction } from "./types";

/** 截图用户的注册时间 */
export const USER_REGISTERED_AT = "2026-03-02T09:30:00.000Z";

/** 截图用户登录凭证的记录编号 */
const CREDENTIAL_ACCOUNT_ID = "visual_account_credential";

export async function seedIdentity(tx: SeedTransaction): Promise<void> {
  await tx.insert(user).values([
    {
      banned: false,
      createdAt: at("2026-01-15T09:00:00.000Z"),
      email: VISUAL_SUPPORT_AGENT.email,
      emailVerified: true,
      id: VISUAL_SUPPORT_AGENT.id,
      name: VISUAL_SUPPORT_AGENT.name,
      role: "admin",
      updatedAt: at("2026-01-15T09:00:00.000Z"),
    },
    {
      banned: false,
      createdAt: at(USER_REGISTERED_AT),
      customerId: VISUAL_PROVIDER.customerId,
      email: VISUAL_USER.email,
      emailVerified: true,
      id: VISUAL_USER.id,
      name: VISUAL_USER.name,
      role: "user",
      updatedAt: at(USER_REGISTERED_AT),
    },
  ]);

  // 用 Better Auth 自带的哈希函数，保证后面能经 /api/auth/sign-in/email 真实登录
  await tx.insert(account).values({
    accountId: VISUAL_USER.id,
    createdAt: at(USER_REGISTERED_AT),
    id: CREDENTIAL_ACCOUNT_ID,
    password: await hashPassword(VISUAL_USER.password),
    providerId: "credential",
    updatedAt: at(USER_REGISTERED_AT),
    userId: VISUAL_USER.id,
  });
}
