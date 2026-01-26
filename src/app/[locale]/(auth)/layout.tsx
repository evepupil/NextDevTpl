import { AuthFooter } from "@/features/auth/components/auth-footer";

/**
 * Auth 路由组布局
 * 用于登录、注册等认证页面
 * 包含简洁的头部和底部
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* 主内容区域 */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* 底部版权和法律链接 */}
      <AuthFooter />
    </div>
  );
}
