/**
 * 认证页面 Logo 组件
 *
 * 用于登录、注册等认证页面的品牌标识展示
 * 图标 + 文字组合
 */

export function AuthLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        className="h-7 w-7 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Logo</title>
        <path d="M3 17 L9 7 L13 14 L21 4" />
        <circle cx="9" cy="7" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="21" cy="4" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      <span className="text-xl font-bold tracking-tight">
        NextDev<span className="text-muted-foreground">Tpl</span>
      </span>
    </div>
  );
}
