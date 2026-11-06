import type { WorkspaceUser } from "@/features/shared/view";
import { getServerSession } from "@/lib/auth/server";

export async function getWorkspaceSession(): Promise<{
  user: WorkspaceUser;
} | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    },
  };
}
