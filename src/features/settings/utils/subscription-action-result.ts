/**
 * 订阅动作（取消 / 恢复等）的结果判定工具
 *
 * 为什么不能靠 try/catch 判断成败：
 * next-safe-action 8 会把服务端抛出的异常捕获并转成返回值里的 `serverError`，
 * 输入校验失败也会转成 `validationErrors` 返回——这两种失败都不会在前端抛异常。
 * 所以 `await action(...)` 正常返回不代表成功，必须检查返回值本身：
 * 只有 `data.success === true` 且没有 `serverError` / `validationErrors` 才算成功。
 */

/** 取消、恢复订阅等动作的返回值（next-safe-action 结果的最小子集） */
export interface SubscriptionActionResult {
  data?: { success?: boolean } | null;
  serverError?: unknown;
  validationErrors?: unknown;
}

/** 动作结果的判定 */
export type SubscriptionActionOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "server-error" | "validation-error" | "not-confirmed";
    };

/**
 * 判定动作结果是否成功。
 *
 * - 有 serverError → { ok: false, reason: "server-error" }（优先级最高）
 * - 否则有 validationErrors → { ok: false, reason: "validation-error" }
 * - 否则 data 缺失、为 null、success 不是 true，或整个结果是 undefined / null
 *   → { ok: false, reason: "not-confirmed" }
 */
export function resolveSubscriptionActionOutcome(
  result: SubscriptionActionResult | null | undefined
): SubscriptionActionOutcome {
  if (result?.serverError !== undefined) {
    return { ok: false, reason: "server-error" };
  }

  if (result?.validationErrors !== undefined) {
    return { ok: false, reason: "validation-error" };
  }

  if (result?.data?.success === true) {
    return { ok: true };
  }

  return { ok: false, reason: "not-confirmed" };
}
