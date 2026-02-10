import { PlanBadge, type PlanType } from "@/features/subscription/components/plan-badge";

const plans: PlanType[] = ["free", "starter", "pro", "ultra"];
const sizes: Array<"xs" | "sm" | "md" | "lg"> = ["xs", "sm", "md", "lg"];

export default function PlanBadgesDemoPage() {
  return (
    <section className="container py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Plan Badge Demo</h1>
          <p className="text-muted-foreground">
            Preview the subscription badge styles across plans and sizes.
          </p>
        </header>

        <div className="space-y-8">
          {sizes.map((size) => (
            <div key={size} className="space-y-3 rounded-xl border bg-card p-6">
              <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Size: {size.toUpperCase()}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {plans.map((plan) => (
                  <PlanBadge key={`${plan}-${size}`} plan={plan} size={size} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
