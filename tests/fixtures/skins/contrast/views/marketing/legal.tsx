import type { MarketingLegalViewProps } from "@/features/marketing/view";

export function MarketingLegal({
  locale,
  slug,
  title,
  formattedDate,
  body,
}: MarketingLegalViewProps) {
  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-10"
      data-locale={locale}
      data-skin-view="marketing.legal"
    >
      <p className="font-mono text-xs uppercase text-primary">{slug}</p>
      <h1 className="mt-3 break-words font-mono text-3xl font-semibold">
        {title}
      </h1>
      <time className="mt-2 block text-xs text-muted-foreground">
        {formattedDate}
      </time>
      <article className="prose prose-sm mt-8 max-w-none border-t border-border pt-6 text-foreground">
        {body}
      </article>
    </main>
  );
}
