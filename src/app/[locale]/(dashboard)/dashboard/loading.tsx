/**
 * Dashboard 页面加载骨架屏
 *
 * Next.js App Router 会在页面数据获取时自动显示此组件
 * 提供即时视觉反馈，避免页面切换时的"卡顿"感
 */
export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 animate-pulse">
      {/* 页面标题骨架 */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded" />
      </div>

      {/* 内容区域骨架 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
            <div className="h-20 w-full bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-muted rounded" />
              <div className="h-8 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
