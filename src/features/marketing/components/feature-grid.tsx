import {
  Cloud,
  Code2,
  Layers,
  Lock,
  Palette,
  Rocket,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Palette,
    title: "Customizable Themes",
    description:
      "Beautiful, responsive themes built with Tailwind CSS. Easily customize colors, fonts, and styles.",
  },
  {
    icon: Lock,
    title: "Authentication Ready",
    description:
      "Pre-built authentication with Better Auth. Support for social logins, magic links, and more.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Built on Next.js 15 with Turbopack. Optimized for performance with edge-ready architecture.",
  },
  {
    icon: Code2,
    title: "Type Safe",
    description:
      "End-to-end TypeScript with strict mode. Catch errors before they reach production.",
  },
  {
    icon: Cloud,
    title: "Multi-Platform Deploy",
    description:
      "Deploy anywhere - Vercel, Netlify, AWS, or self-host. Works great on edge runtimes.",
  },
  {
    icon: Layers,
    title: "Database Agnostic",
    description:
      "Use Drizzle ORM with PostgreSQL, MySQL, or SQLite. Easy migrations and type-safe queries.",
  },
  {
    icon: Settings,
    title: "Developer Experience",
    description:
      "ESLint, Prettier, and Biome configured. Git hooks with Husky for code quality.",
  },
  {
    icon: Sparkles,
    title: "AI Integration",
    description:
      "Ready-to-use AI components and hooks. OpenAI, Anthropic, and more supported.",
  },
  {
    icon: Rocket,
    title: "Production Ready",
    description:
      "SEO optimized, analytics ready, and fully accessible. Ship with confidence.",
  },
];

export function FeatureGrid() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            A Collection of Components Built With{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Shadcn & Tailwind
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to build modern web applications. Pre-configured
            and ready to use.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group rounded-xl border-0 bg-muted/50 transition-colors hover:bg-muted"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-900/50">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
