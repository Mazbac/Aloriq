import { getDemoUser, prisma } from "@/lib/prisma";
import { GoalForm } from "@/components/goals/goal-form";

export const dynamic = "force-dynamic";

export default async function NewGoalPage() {
  const user = await getDemoUser();
  const [domains, needs, values] = await Promise.all([
    prisma.lifeDomain.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.need.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.value.findMany({ where: { userId: user.id }, orderBy: [{ rank: "asc" }, { name: "asc" }] }),
  ]);

  return <GoalForm domains={domains} needs={needs} values={values} />;
}
