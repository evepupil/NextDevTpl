import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthFooter } from "@/features/auth/components/auth-footer";

/**
 * Auth 路由组布局
 *
 * 品牌分屏：左 = 深色品牌面板（lg+ 显示），右 = 跟随主题的表单区 + 页脚。
 * 移动端品牌面板隐藏，只剩表单 + 页脚。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <div className="flex flex-col bg-background">
        {/* 主内容区域 */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          {children}
        </main>

        {/* 底部版权和法律链接 */}
        <AuthFooter />
      </div>
    </div>
  );
}
