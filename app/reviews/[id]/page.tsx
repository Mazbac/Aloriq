import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: { goalReviews: { include: { goal: true } } },
  });
  if (!review) notFound();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{formatDate(review.periodStart)} to {formatDate(review.periodEnd)}</CardTitle>
          <CardDescription>{enumLabel(review.reviewType)} review</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ReviewText title="Wins" text={review.wins} />
          <ReviewText title="Misses" text={review.misses} />
          <ReviewText title="Blockers" text={review.blockers} />
          <ReviewText title="Lessons" text={review.lessons} />
          <ReviewText title="Domain damage" text={review.domainDamage} />
          <ReviewText title="Continue / adjust / pause / kill" text={review.continueAdjustPauseKill} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {review.goalReviews.map((goalReview) => (
          <Card key={goalReview.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{goalReview.goal.title}</CardTitle>
                  <CardDescription>{goalReview.progressSummary || "No progress summary."}</CardDescription>
                </div>
                <Badge>{enumLabel(goalReview.decision)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Score label="Alignment" value={goalReview.alignmentScore} />
                <Score label="Cost" value={goalReview.costScore} />
                <Score label="Confidence" value={goalReview.confidenceScore} />
              </div>
              <ReviewText title="Reason" text={goalReview.decisionReason} />
              <ReviewText title="Still want this" text={goalReview.stillWantThis} />
              <ReviewText title="Reality vs fantasy" text={goalReview.realityVsFantasy} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ReviewText({ title, text }: { title: string; text?: string | null }) {
  return <div><div className="text-sm font-medium">{title}</div><p className="mt-1 text-sm text-muted-foreground">{text || "Not recorded."}</p></div>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-muted p-3"><div className="text-xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}
