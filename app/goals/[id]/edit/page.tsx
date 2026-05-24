import { notFound } from "next/navigation";
import { getDemoUser, prisma } from "@/lib/prisma";
import { GoalForm } from "@/components/goals/goal-form";

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const [goal, domains, needs, values] = await Promise.all([
    prisma.goal.findUnique({ where: { id }, include: { needs: true, values: true, criteria: true } }),
    prisma.lifeDomain.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.need.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.value.findMany({ where: { userId: user.id }, orderBy: [{ rank: "asc" }, { name: "asc" }] }),
  ]);
  if (!goal) notFound();
  return <GoalForm goal={goal} domains={domains} needs={needs} values={values} />;
}
