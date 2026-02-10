/**
 * 认证错误提示组件
 *
 * 用于显示登录、注册等认证流程中的错误信息
 * 统一的错误提示样式
 */

interface AuthErrorAlertProps {
  /** 错误信息，为 null 时不显示 */
  message: string | null;
  /** 自定义类名 */
  className?: string;
}

export function AuthErrorAlert({ message, className }: AuthErrorAlertProps) {
  // 没有错误信息时不渲染
  if (!message) return null;

  return (
    <div
      className={
        className ||
        "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
      }
    >
      {message}
    </div>
  );
}
