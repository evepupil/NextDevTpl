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
        fill="currentColor"
      >
        <title>Logo</title>
        <rect x="2" y="2" width="9" height="9" rx="2" />
        <rect x="13" y="2" width="9" height="9" rx="2" opacity="0.5" />
        <rect x="2" y="13" width="9" height="9" rx="2" opacity="0.5" />
        <rect x="13" y="13" width="9" height="9" rx="2" />
      </svg>
      <span className="text-xl font-bold tracking-tight">
        NextDev<span className="text-primary">Tpl</span>
      </span>
    </div>
  );
}
