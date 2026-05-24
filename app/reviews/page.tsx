import Link from "next/link";
import { Plus } from "lucide-react";
import { getDemoUser, prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ReviewsPage() {
  const user = await getDemoUser();
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { periodStart: "desc" },
    include: { goalReviews: true },
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Reviews</h2>
          <p className="text-sm text-muted-foreground">Adapt goals based on progress, cost, and alignment.</p>
        </div>
        <Button asChild><Link href="/reviews/new"><Plus className="size-4" />New weekly review</Link></Button>
      </div>
      {reviews.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{formatDate(review.periodStart)} to {formatDate(review.periodEnd)}</CardTitle>
                    <CardDescription>{review.goalReviews.length} goals reviewed</CardDescription>
                  </div>
                  <Badge>{enumLabel(review.reviewType)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {review.goalReviews.map((goalReview) => <Badge key={goalReview.id} variant="secondary">{enumLabel(goalReview.decision)}</Badge>)}
                </div>
                <p className="text-sm text-muted-foreground">{review.continueAdjustPauseKill || review.lessons || "No summary entered."}</p>
                <Button asChild variant="outline"><Link href={`/reviews/${review.id}`}>Open review</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>No reviews yet</CardTitle><CardDescription>Start a weekly review to decide what to continue, adjust, pause, or kill.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link href="/reviews/new">Start review</Link></Button></CardContent>
        </Card>
      )}
    </div>
  );
}
