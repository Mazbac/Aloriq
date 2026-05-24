import { getDemoUser } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getDemoUser();
  return <SettingsForm user={user} />;
}
