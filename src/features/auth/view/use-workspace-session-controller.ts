"use client";

import { useLocale } from "next-intl";

import type { WorkspaceUser } from "@/features/shared/view";
import type { Locale } from "@/i18n/routing";
import { signOut, useSession } from "@/lib/auth/client";
import { navigateAfterSignOut } from "@/lib/auth/navigation";

export interface WorkspaceSessionController {
  user: WorkspaceUser | null;
  onSignOut: () => Promise<void>;
}

export function useWorkspaceSessionController(): WorkspaceSessionController {
  const { data: session } = useSession();
  const locale = useLocale() as Locale;
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }
    : null;

  const onSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => navigateAfterSignOut(locale),
      },
    });
  };

  return { user, onSignOut };
}
