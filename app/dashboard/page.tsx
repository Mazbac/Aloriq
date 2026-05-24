import Link from "next/link";
import { redirect } from "next/navigation";
import { GoalStatus, MetricType } from "@prisma/client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDemoUser, prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";
import { currentWeekRange } from "@/lib/goals/activation";
import { metricCompleteness } from "@/components/goals/goal-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getDemoUser();
  if (!user.setupCompletedAt && !user.setupSkippedAt) redirect("/setup");
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const [goals, domains, reviews, commitments, staleCommitments] = await Promise.all([
    prisma.goal.findMany({
      where: { userId: user.id },
      include: { lifeDomain: true, values: true, metrics: true, weeklyCommitments: { where: { weekStartDate: { gte: week.start, lt: week.end } }, orderBy: { weekStartDate: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lifeDomain.findMany({ where: { userId: user.id }, orderBy: [{ riskScore: "desc" }, { importanceScore: "desc" }], take: 4 }),
    prisma.review.findMany({ where: { userId: user.id }, orderBy: { periodStart: "desc" }, take: 1 }),
    prisma.weeklyCommitment.findMany({ where: { goal: { userId: user.id, status: "ACTIVE" }, weekStartDate: { gte: week.start, lt: week.end } }, include: { goal: true }, orderBy: { weekStartDate: "desc" }, take: 6 }),
    prisma.weeklyCommitment.findMany({ where: { goal: { userId: user.id, status: "ACTIVE" }, weekStartDate: { lt: week.start }, status: { in: ["PLANNED", "PARTIAL"] } }, include: { goal: true }, orderBy: { weekStartDate: "desc" }, take: 4 }),
  ]);

  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");
  const byStatus = Object.values(GoalStatus).map((status) => ({ status, count: goals.filter((goal) => goal.status === status).length }));
  const missingValues = activeGoals.filter((goal) => goal.values.length === 0);
  const missingMetrics = activeGoals.filter((goal) => Object.values(MetricType).some((type) => !goal.metrics.some((metric) => metric.type === type)));
  const missingCommitments = activeGoals.filter((goal) => goal.weeklyCommitments.length === 0);
  const latestReview = reviews[0];
  const reviewDue = !latestReview || latestReview.periodStart < week.start;

  return (
    <div className="space-y-6">
      {user.setupSkippedAt && !user.setupCompletedAt ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Setup incomplete</CardTitle>
            <CardDescription>Aloriq works best after you define one goal, a metric stack, and a weekly commitment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link href="/setup">Continue setup</Link></Button>
            {goals.length === 0 ? <Button asChild variant="outline"><Link href="/goals/new">Create goal</Link></Button> : null}
          </CardContent>
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>Start with Aloriq</CardTitle><CardDescription>Complete Life Map, define values, then create the first structured goal.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link href="/life-map">Open Life Map</Link></Button>
            <Button asChild variant="outline"><Link href="/values">Define Values</Link></Button>
            <Button asChild variant="outline"><Link href="/goals/new">Create Goal</Link></Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Active goals" value={activeGoals.length} text="Goals currently asking for weekly commitment." />
        <Stat title="Weekly review" value={reviewDue ? "Due" : "Current"} text={latestReview ? `Last review: ${formatDate(latestReview.periodStart)}` : "No review yet."} />
        <Stat title="Current commitments" value={commitments.length} text="Manual weekly commitments across active goals." />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Goals by status</CardTitle><CardDescription>Portfolio state.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-md bg-muted p-3">
                <span className="text-sm">{enumLabel(item.status)}</span>
                <Badge>{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>High-risk domains</CardTitle><CardDescription>Neutral signal, not a diagnosis.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {domains.map((domain) => (
              <div key={domain.id} className="rounded-md border bg-background p-3">
                <div className="flex justify-between gap-2"><span className="font-medium">{domain.name}</span><Badge variant={domain.riskScore >= 7 ? "destructive" : "secondary"}>Risk {domain.riskScore}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">Importance {domain.importanceScore} · Satisfaction {domain.satisfactionScore}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Setup warnings</CardTitle><CardDescription>Active goals missing alignment structure.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Warning label="Missing values" count={missingValues.length} href={missingValues[0] ? `/goals/${missingValues[0].id}` : "/goals"} />
            <Warning label="Missing metric stack" count={missingMetrics.length} href={missingMetrics[0] ? `/goals/${missingMetrics[0].id}` : "/goals"} />
            <Warning label="Missing weekly commitment" count={missingCommitments.length} href={missingCommitments[0] ? `/goals/${missingCommitments[0].id}` : "/goals"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Current commitments</CardTitle><CardDescription>What should be committed to this week.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {commitments.length ? commitments.map((commitment) => (
              <div key={commitment.id} className="rounded-md border bg-background p-3">
                <div className="font-medium">{commitment.statement}</div>
                <p className="text-sm text-muted-foreground">{commitment.goal.title} · {enumLabel(commitment.status)}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">No current commitments.</p>}
            {staleCommitments.length ? (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {staleCommitments.length} stale planned or partial commitments exist from earlier weeks.
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active goal summaries</CardTitle><CardDescription>Progress structure at a glance.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {activeGoals.length ? activeGoals.map((goal) => {
              const completeness = metricCompleteness(goal.metrics);
              return (
                <Link href={`/goals/${goal.id}`} key={goal.id} className="block rounded-md border bg-background p-3 hover:bg-accent">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{goal.title}</span>
                    <Badge variant="outline">{goal.lifeDomain.name}</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={completeness.percent} />
                    <span className="text-sm text-muted-foreground">{Math.round(completeness.percent)}%</span>
                  </div>
                </Link>
              );
            }) : <p className="text-sm text-muted-foreground">No active goals.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ title, value, text }: { title: string; value: string | number; text: string }) {
  return (
    <Card><CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold">{value}</div><p className="mt-1 text-sm text-muted-foreground">{text}</p></CardContent></Card>
  );
}

function Warning({ label, count, href }: { label: string; count: number; href: string }) {
  const Icon = count ? AlertTriangle : CheckCircle2;
  return (
    <Button asChild variant="outline" className="h-auto w-full justify-start p-3">
      <Link href={href}><Icon className="size-4" />{label}<Badge className="ml-auto" variant={count ? "destructive" : "secondary"}>{count}</Badge></Link>
    </Button>
  );
}
