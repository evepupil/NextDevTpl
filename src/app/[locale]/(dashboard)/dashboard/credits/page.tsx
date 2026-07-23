import { redirect } from "next/navigation";

export default function CreditsPage() {
  redirect("/dashboard/settings?tab=usage");
}
