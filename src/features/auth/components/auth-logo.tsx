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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>Logo</title>
        <rect x="5" y="2" width="14" height="17" rx="2" opacity="0.35" />
        <rect x="3" y="5" width="14" height="17" rx="2" />
        <path d="M7 18l3-8 3 8" />
        <path d="M8 16h4" />
      </svg>
      <span className="text-xl font-bold tracking-tight">
        Anki<span className="text-primary">Genix</span>
      </span>
    </div>
  );
}
