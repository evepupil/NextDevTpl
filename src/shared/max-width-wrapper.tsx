import { cn } from "@/lib/utils";

/**
 * 最大宽度容器组件
 *
 * 功能:
 * - 提供统一的页面内容最大宽度限制
 * - 自动居中对齐
 * - 响应式内边距
 *
 * 使用场景:
 * - 包裹页面主要内容区域
 * - 确保内容在大屏幕上不会过宽
 */

interface MaxWidthWrapperProps {
  /**
   * 子元素
   */
  children: React.ReactNode;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 是否使用较小的最大宽度
   * - false: max-w-7xl (默认, 80rem)
   * - true: max-w-5xl (64rem)
   */
  narrow?: boolean;
}

export function MaxWidthWrapper({
  children,
  className,
  narrow = false,
}: MaxWidthWrapperProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-5xl" : "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}
