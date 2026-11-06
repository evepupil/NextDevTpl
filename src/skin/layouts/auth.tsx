import type { AuthLayoutViewProps } from "@/features/auth/view";

import { AuthBrandPanel } from "@/skin/views/auth/components/auth-brand-panel";
import { AuthFooter } from "@/skin/views/auth/components/auth-footer";

export function AuthLayout({ children }: AuthLayoutViewProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <div className="flex flex-col bg-background">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          {children}
        </main>
        <AuthFooter />
      </div>
    </div>
  );
}
