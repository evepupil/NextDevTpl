import Link from "next/link";

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
      <footer className="border-t bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Settings
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
