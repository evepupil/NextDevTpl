/**
 * 认证错误类型
 */
export enum AuthErrorCode {
  /** 未认证 - 用户未登录 */
  UNAUTHENTICATED = "UNAUTHENTICATED",
  /** 未授权 - 用户无权限访问 */
  UNAUTHORIZED = "UNAUTHORIZED",
  /** 无效凭证 - 邮箱或密码错误 */
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  /** 用户已存在 - 邮箱已被注册 */
  USER_EXISTS = "USER_EXISTS",
  /** 用户不存在 */
  USER_NOT_FOUND = "USER_NOT_FOUND",
  /** 会话过期 */
  SESSION_EXPIRED = "SESSION_EXPIRED",
  /** OAuth 错误 */
  OAUTH_ERROR = "OAUTH_ERROR",
  /** 邮箱未验证 */
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  /** 未知错误 */
  UNKNOWN = "UNKNOWN",
}

/**
 * 认证错误类
 */
export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message || getDefaultMessage(code));
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * 获取错误码的默认消息
 */
function getDefaultMessage(code: AuthErrorCode): string {
  const messages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.UNAUTHENTICATED]: "请先登录后再执行此操作",
    [AuthErrorCode.UNAUTHORIZED]: "您没有权限执行此操作",
    [AuthErrorCode.INVALID_CREDENTIALS]: "邮箱或密码错误",
    [AuthErrorCode.USER_EXISTS]: "该邮箱已被注册",
    [AuthErrorCode.USER_NOT_FOUND]: "用户不存在",
    [AuthErrorCode.SESSION_EXPIRED]: "会话已过期，请重新登录",
    [AuthErrorCode.OAUTH_ERROR]: "第三方登录失败，请重试",
    [AuthErrorCode.EMAIL_NOT_VERIFIED]: "请先验证您的邮箱",
    [AuthErrorCode.UNKNOWN]: "发生未知错误，请稍后重试",
  };

  return messages[code];
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * 从未知错误创建 AuthError
 */
export function toAuthError(error: unknown): AuthError {
  if (isAuthError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // 尝试从错误消息推断错误类型
    const message = error.message.toLowerCase();

    if (message.includes("unauthorized") || message.includes("未授权")) {
      return new AuthError(AuthErrorCode.UNAUTHORIZED);
    }
    if (message.includes("unauthenticated") || message.includes("未登录")) {
      return new AuthError(AuthErrorCode.UNAUTHENTICATED);
    }
    if (message.includes("invalid") || message.includes("credentials")) {
      return new AuthError(AuthErrorCode.INVALID_CREDENTIALS);
    }
    if (message.includes("exists") || message.includes("已存在")) {
      return new AuthError(AuthErrorCode.USER_EXISTS);
    }
    if (message.includes("not found") || message.includes("不存在")) {
      return new AuthError(AuthErrorCode.USER_NOT_FOUND);
    }
    if (message.includes("expired") || message.includes("过期")) {
      return new AuthError(AuthErrorCode.SESSION_EXPIRED);
    }

    return new AuthError(AuthErrorCode.UNKNOWN, error.message);
  }

  return new AuthError(AuthErrorCode.UNKNOWN);
}
