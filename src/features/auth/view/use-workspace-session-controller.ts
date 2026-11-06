"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "@/i18n/routing";
import type { WorkspaceUser } from "@/features/shared/view";

export interface WorkspaceSessionController {
  user: WorkspaceUser | null;
  onSignOut: () => Promise<void>;
}

export function useWorkspaceSessionController(): WorkspaceSessionController {
  const { data: session } = useSession();
  const router = useRouter();
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
        onSuccess: () => router.push("/"),
      },
    });
  };

  return { user, onSignOut };
}
