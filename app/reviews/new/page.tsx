import { getDemoUser, prisma } from "@/lib/prisma";
import { startOfWeek } from "@/lib/utils";
import { ReviewForm } from "@/components/reviews/review-form";

export default async function NewReviewPage() {
  const user = await getDemoUser();
  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: {
      metrics: { include: { entries: { orderBy: { entryDate: "desc" }, take: 1 } } },
      weeklyCommitments: { orderBy: { weekStartDate: "desc" }, take: 4 },
    },
  });
  const periodStart = startOfWeek(new Date(), user.preferredWeekStartDay);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodStart.getDate() + 6);
  return <ReviewForm goals={goals} periodStart={periodStart} periodEnd={periodEnd} />;
}
