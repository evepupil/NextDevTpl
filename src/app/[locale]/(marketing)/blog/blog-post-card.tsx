import { Link } from "@/i18n/routing";

/**
 * 博客文章卡片属性
 */
interface BlogPostCardProps {
  slug: string;
  title: string;
  description?: string | undefined;
  date: string;
  author?: string | undefined;
  tags?: string[] | undefined;
}

/**
 * 博客文章卡片组件
 *
 * 用于在博客列表页面显示文章摘要
 */
export function BlogPostCard({
  slug,
  title,
  description,
  date,
  author,
  tags,
}: BlogPostCardProps) {
  return (
    <article className="group">
      <Link
        href={`/blog/${slug}`}
        className="flex flex-col gap-8 md:flex-row md:items-start"
      >
        {/* 文本内容 */}
        <div className="flex-1 space-y-4">
          {/* 标签 */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-primary md:text-3xl">
            {title}
          </h2>

          {/* 描述 */}
          {description && (
            <p className="leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {/* 元数据 */}
          <p className="text-sm text-muted-foreground">
            {author && `${author} • `}
            {date}
          </p>
        </div>

        {/* 图片占位符 */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border bg-muted md:w-[380px]">
          <div className="flex h-full items-center justify-center">
            <div className="grid grid-cols-2 gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                <span className="text-lg font-bold">N</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                <span className="text-lg font-bold text-blue-500">⚛</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                <span className="text-lg font-bold text-blue-600">TS</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                <span className="text-lg font-bold text-cyan-500">🌊</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
