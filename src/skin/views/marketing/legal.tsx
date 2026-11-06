import type { MarketingLegalViewProps } from "@/features/marketing/view";
import { Link } from "@/i18n/routing";

export function MarketingLegalView({
  body,
  formattedDate,
  locale,
  slug,
  title,
}: MarketingLegalViewProps) {
  return (
    <article className="container mx-auto max-w-3xl py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {locale === "zh" ? "返回首页" : "Back to Home"}
      </Link>

      <header className="mb-8 border-b pb-8">
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>

        <p className="text-sm text-muted-foreground">
          {locale === "zh" ? "最后更新：" : "Last Updated: "}
          <time dateTime={formattedDate}>{formattedDate}</time>
        </p>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border">
        {body}
      </div>

      <footer className="mt-12 border-t pt-8">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">
            {locale === "zh" ? "其他法律文档：" : "Other Legal Documents:"}
          </span>
          {slug !== "terms" && (
            <Link href="/legal/terms" className="text-primary hover:underline">
              {locale === "zh" ? "服务条款" : "Terms of Service"}
            </Link>
          )}
          {slug !== "privacy" && (
            <Link
              href="/legal/privacy"
              className="text-primary hover:underline"
            >
              {locale === "zh" ? "隐私政策" : "Privacy Policy"}
            </Link>
          )}
          {slug !== "cookie-policy" && (
            <Link
              href="/legal/cookie-policy"
              className="text-primary hover:underline"
            >
              {locale === "zh" ? "Cookie 政策" : "Cookie Policy"}
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
