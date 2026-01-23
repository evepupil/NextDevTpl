import Link from "next/link";

export default function HomePage() {
  return (
    <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-6 md:py-20">
      <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium">
          Now in Beta
        </span>

        <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Build your SaaS
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            10x faster
          </span>
        </h1>

        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          A modern, type-safe SaaS boilerplate with Next.js 15, React 19,
          Tailwind CSS 4, and everything you need to ship fast.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started
        </Link>
        <Link
          href="/docs"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Documentation
        </Link>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="font-semibold">Lightning Fast</h3>
          <p className="text-sm text-muted-foreground">
            Built on Next.js 15 with Turbopack for instant dev experience.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="font-semibold">Type Safe</h3>
          <p className="text-sm text-muted-foreground">
            End-to-end type safety with TypeScript strict mode.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-2xl">🎨</span>
          </div>
          <h3 className="font-semibold">Beautiful UI</h3>
          <p className="text-sm text-muted-foreground">
            Shadcn/UI components with Tailwind CSS 4.
          </p>
        </div>
      </div>
    </section>
  );
}
