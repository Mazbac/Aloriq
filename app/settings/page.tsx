import { getDemoUser } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await getDemoUser();
  return <SettingsForm user={user} />;
}
