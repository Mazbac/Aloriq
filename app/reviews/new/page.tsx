import { getDemoUser, prisma } from "@/lib/prisma";
import { startOfWeek } from "@/lib/utils";
import { currentWeekRange } from "@/lib/goals/activation";
import { ReviewForm } from "@/components/reviews/review-form";

export const dynamic = "force-dynamic";

export default async function NewReviewPage() {
  const user = await getDemoUser();
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: {
      metrics: { include: { entries: { orderBy: { entryDate: "desc" }, take: 1 } } },
      weeklyCommitments: { where: { weekStartDate: { gte: week.start, lt: week.end } }, orderBy: { weekStartDate: "desc" } },
    },
  });
  const periodStart = startOfWeek(new Date(), user.preferredWeekStartDay);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);
  return <ReviewForm goals={goals} periodStart={periodStart} periodEnd={periodEnd} userCurrency={user.currency} />;
}
