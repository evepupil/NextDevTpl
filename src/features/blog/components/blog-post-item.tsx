import Link from "next/link";
import type { BlogPost } from "../data/mock-posts";

interface BlogPostItemProps {
  post: BlogPost;
}

export function BlogPostItem({ post }: BlogPostItemProps) {
  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-col gap-8 md:flex-row md:items-start"
      >
        {/* Text Content */}
        <div className="flex-1 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-violet-600 md:text-3xl">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>

          {/* Metadata */}
          <p className="text-sm text-muted-foreground">
            {post.author} • {post.date}
          </p>
        </div>

        {/* Image */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border bg-muted md:w-[380px]">
          <div className="flex h-full items-center justify-center">
            {/* Placeholder for blog image */}
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
