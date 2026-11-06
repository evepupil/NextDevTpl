/**
 * 用截图账号经真实登录接口登录，把会话保存成 storageState
 *
 * 控制台页面的用例直接加载这份会话；营销页和登录页用空白状态，保持“未登录”。
 * Better Auth 会校验请求来源，所以要带上和 trustedOrigins 一致的 Origin 头。
 */

import fs from "node:fs";
import path from "node:path";

import { request } from "@playwright/test";

import { VISUAL_BASE_URL, VISUAL_USER } from "../constants";
import { AUTH_STATE_FILE } from "../paths";

export async function signInAndSaveState(): Promise<void> {
  const api = await request.newContext({
    baseURL: VISUAL_BASE_URL,
    extraHTTPHeaders: { Origin: VISUAL_BASE_URL },
  });
  try {
    const response = await api.post("/api/auth/sign-in/email", {
      data: { email: VISUAL_USER.email, password: VISUAL_USER.password },
      timeout: 120_000,
    });
    if (!response.ok()) {
      throw new Error(
        `截图账号登录失败：HTTP ${response.status()} ${await response.text()}`
      );
    }
    fs.mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });
    const state = await api.storageState({ path: AUTH_STATE_FILE });
    const hasSession = state.cookies.some((cookie) =>
      cookie.name.endsWith("better-auth.session_token")
    );
    if (!hasSession) {
      throw new Error("登录接口成功返回，但没有拿到会话 Cookie");
    }
  } finally {
    await api.dispose();
  }
}
