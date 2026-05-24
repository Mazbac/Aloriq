import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { getDemoUser, prisma } from "@/lib/prisma";
import { activationChecklist, currentWeekRange } from "@/lib/goals/activation";
import { interpretMetricTrend } from "@/lib/goals/trends";
import { decimalToNumber, enumLabel, formatDate } from "@/lib/utils";
import { metricCompleteness } from "@/components/goals/goal-card";
import { AddRecommendedMetricStackButton, BreakdownForm, CommitmentForm, CommitmentStatusForm, MetricEntryForm, MetricForm } from "@/components/goals/goal-tools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getDemoUser();
  const { id } = await params;
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      lifeDomain: true,
      needs: { include: { need: true } },
      values: { include: { value: true } },
      criteria: true,
      metrics: { include: { entries: { orderBy: { entryDate: "desc" }, take: 4 } }, orderBy: { createdAt: "asc" } },
      weeklyCommitments: { orderBy: { weekStartDate: "desc" } },
      breakdownAssumptions: true,
      breakdownOutputs: { orderBy: { createdAt: "asc" } },
      reviews: { include: { review: true }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!goal) notFound();

  const thisWeekCommitments = goal.weeklyCommitments.filter((commitment) => commitment.weekStartDate >= week.start && commitment.weekStartDate < week.end);
  const pastCommitments = goal.weeklyCommitments.filter((commitment) => commitment.weekStartDate < week.start);
  const completeness = metricCompleteness(goal.metrics);
  const checklist = activationChecklist({
    status: goal.status,
    successDefinition: goal.successDefinition,
    connectedValueCount: goal.values.length,
    metrics: goal.metrics,
    currentWeekCommitmentCount: thisWeekCommitments.length,
  });
  const suggestedCommitment = goal.breakdownOutputs.find((output) => output.label === "Suggested weekly commitment")?.value;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{enumLabel(goal.status)}</Badge>
            <Badge variant="secondary">{goal.lifeDomain.name}</Badge>
            <Badge variant="outline">{enumLabel(goal.goalType)}</Badge>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-normal">{goal.title}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{goal.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/goals/${goal.id}/edit`}><Pencil className="size-4" />Edit goal</Link></Button>
          {goal.externalWorkUrl ? <Button asChild><a href={goal.externalWorkUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open work tool</a></Button> : null}
          <Button asChild variant="secondary"><Link href="/reviews/new">Start review</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="commitments">Commitments</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle>Success</CardTitle><CardDescription>How you will know it is real.</CardDescription></CardHeader><CardContent className="text-sm">{goal.successDefinition || "Not written yet."}</CardContent></Card>
            <Card><CardHeader><CardTitle>Cost</CardTitle><CardDescription>What this asks from life.</CardDescription></CardHeader><CardContent className="text-sm">{goal.tradeOffs || "No trade-offs written yet."}</CardContent></Card>
            <Card><CardHeader><CardTitle>Kill condition</CardTitle><CardDescription>When it stops being worth it.</CardDescription></CardHeader><CardContent className="text-sm">{goal.notWorthItIf || "No condition written yet."}</CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Activation checklist</CardTitle><CardDescription>Only Active goals need all four checks.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
                  <span className="text-sm">{item.label}</span>
                  <Badge variant={item.complete ? "secondary" : "destructive"}>{item.complete ? "Ready" : "Missing"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Alignment links</CardTitle><CardDescription>Needs, values, and goal-specific criteria.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <TagList title="Needs" items={goal.needs.map((item) => item.need.name)} />
              <TagList title="Values" items={goal.values.map((item) => item.value.name)} />
              <TagList title="Criteria" items={goal.criteria.map((item) => item.statement)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Metric stack</CardTitle>
                  <CardDescription>Complete means at least one outcome, lead, risk, and alignment metric.</CardDescription>
                </div>
                <AddRecommendedMetricStackButton goalId={goal.id} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={completeness.percent} />
              {completeness.missing.length ? <p className="text-sm text-muted-foreground">Missing {completeness.missing.map(enumLabel).join(", ")}.</p> : <p className="text-sm text-primary">Metric stack is complete.</p>}
              <div className="grid gap-3 lg:grid-cols-2">
                {goal.metrics.map((metric) => {
                  const latest = metric.entries[0];
                  const previous = metric.entries[1];
                  const latestValue = latest ? decimalToNumber(latest.value) : decimalToNumber(metric.currentValue);
                  const prevValue = previous ? decimalToNumber(previous.value) : null;
                  const targetValue = decimalToNumber(metric.targetValue);
                  const trend = interpretMetricTrend({ direction: metric.direction, latest: latestValue, previous: prevValue, target: targetValue });
                  return (
                    <div key={metric.id} className="rounded-md border bg-background p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">{metric.name}</div>
                        <Badge variant="secondary">{enumLabel(metric.type)}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">Current: {latestValue ?? "No value"} {metric.unit || ""} · {trend}</div>
                      <MetricEntryForm metric={metric} goalId={goal.id} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <MetricForm goalId={goal.id} />
        </TabsContent>

        <TabsContent value="breakdown" className="grid gap-6 xl:grid-cols-2">
          <BreakdownForm goalId={goal.id} goalType={goal.goalType} assumptions={goal.breakdownAssumptions} targetDate={goal.targetDate} />
          <Card>
            <CardHeader><CardTitle>Breakdown outputs</CardTitle><CardDescription>Generated calculations and suggested commitment.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {goal.breakdownOutputs.length ? goal.breakdownOutputs.map((output) => (
                <div key={output.id} className="rounded-md border bg-background p-3">
                  <div className="text-sm text-muted-foreground">{output.label}</div>
                  <div className="mt-1 text-xl font-semibold">{output.value} {output.unit}</div>
                  {output.period ? <div className="text-xs text-muted-foreground">per {output.period}</div> : null}
                  {output.explanation ? <p className="mt-2 text-xs text-muted-foreground">{output.explanation}</p> : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">Run the breakdown to create outputs.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commitments" className="space-y-4">
          <CommitmentForm goalId={goal.id} suggested={suggestedCommitment} />
          <CommitmentList title="This week" commitments={thisWeekCommitments} goalId={goal.id} />
          {pastCommitments.length ? <CommitmentList title="Past commitments" commitments={pastCommitments.slice(0, 5)} goalId={goal.id} /> : null}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Revalidation questions</CardTitle><CardDescription>Use these in the advanced section of reviews.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {["Do I still want this?", "Do I want the reality of this, or only the fantasy?", "Is this still connected to my values?", "Is the cost still acceptable?", "Has this started damaging another life domain?", "Should I continue, adjust, pause, or kill it?"].map((question) => (
                <div key={question} className="rounded-md bg-muted p-3 text-sm">{question}</div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent reviews</CardTitle><CardDescription>Decisions made about this goal.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {goal.reviews.length ? goal.reviews.map((review) => (
                <div key={review.id} className="rounded-md border bg-background p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{enumLabel(review.decision)}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(review.review.periodStart)} to {formatDate(review.review.periodEnd)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.progressSummary}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type CommitmentListItem = {
  id: string;
  weekStartDate: Date;
  statement: string;
  status: import("@prisma/client").CommitmentStatus;
  targetValue: unknown;
  actualValue: unknown;
  unit: string | null;
  notes: string | null;
};

function CommitmentList({ title, commitments, goalId }: { title: string; commitments: CommitmentListItem[]; goalId: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Weekly commitments stay lightweight.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {commitments.length ? commitments.map((commitment) => (
          <div key={commitment.id} className="rounded-md border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{commitment.statement}</div>
              <Badge variant="secondary">{enumLabel(commitment.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Week of {formatDate(commitment.weekStartDate)} · target {decimalToNumber(commitment.targetValue) ?? "-"} {commitment.unit ?? ""}</p>
            <CommitmentStatusForm id={commitment.id} goalId={goalId} status={commitment.status} actualValue={commitment.actualValue} notes={commitment.notes} />
          </div>
        )) : <p className="text-sm text-muted-foreground">No commitments in this section.</p>}
      </CardContent>
    </Card>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item} variant="outline">{item}</Badge>) : <span className="text-sm text-muted-foreground">None yet</span>}
      </div>
    </div>
  );
}
