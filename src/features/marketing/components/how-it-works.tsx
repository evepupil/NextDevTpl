import { Check, GitBranch, Rocket, Settings } from "lucide-react";

const steps = [
  {
    icon: GitBranch,
    step: "01",
    title: "Clone the Repository",
    description:
      "Get started in seconds by cloning the repository. All dependencies and configurations are pre-setup.",
    code: "git clone https://github.com/nextdevtpl/starter",
  },
  {
    icon: Settings,
    step: "02",
    title: "Configure Your Project",
    description:
      "Set up your environment variables, database connection, and authentication providers.",
    code: "cp .env.example .env.local",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Deploy to Production",
    description:
      "Push to your git provider and deploy instantly to Vercel, Netlify, or your preferred platform.",
    code: "vercel deploy --prod",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            How to get started
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Get your project up and running in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex gap-6 md:gap-10">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 h-[calc(100%-2rem)] w-px bg-border md:left-10" />
                )}

                {/* Icon */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm md:h-20 md:w-20">
                  <Icon className="h-5 w-5 text-violet-600 md:h-8 md:w-8" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-medium text-violet-600">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mb-4 text-muted-foreground">
                    {step.description}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 font-mono text-sm">
                    <code>{step.code}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border bg-muted/50 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">You&apos;re all set!</p>
            <p className="text-sm text-muted-foreground">
              Start building your application with all the features included.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
