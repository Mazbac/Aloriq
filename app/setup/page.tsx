import Link from "next/link";
import { getDemoUser, prisma } from "@/lib/prisma";
import { currentWeekRange, metricStackMissing } from "@/lib/goals/activation";
import { LifeDomainForm } from "@/components/life-map/life-domain-form";
import { GoalForm } from "@/components/goals/goal-form";
import { AddRecommendedMetricStackButton, CommitmentForm } from "@/components/goals/goal-tools";
import { SetupCompletion, TopValuesForm } from "@/components/setup/setup-flow";
import { ValuesManager } from "@/components/values/values-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await getDemoUser();
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const [domains, needs, values, firstGoal] = await Promise.all([
    prisma.lifeDomain.findMany({ where: { userId: user.id }, orderBy: [{ riskScore: "desc" }, { importanceScore: "desc" }] }),
    prisma.need.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.value.findMany({ where: { userId: user.id }, orderBy: [{ rank: "asc" }, { name: "asc" }], include: { criteria: true } }),
    prisma.goal.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
        metrics: true,
        weeklyCommitments: { where: { weekStartDate: { gte: week.start, lt: week.end } } },
      },
    }),
  ]);
  const topValues = values.filter((value) => value.rank);
  const setupReady = Boolean(
    firstGoal &&
      metricStackMissing(firstGoal.metrics).length === 0 &&
      firstGoal.weeklyCommitments.length > 0 &&
      topValues.length > 0 &&
      topValues.some((value) => value.criteria.length > 0),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Guided setup</h2>
        <p className="text-sm text-muted-foreground">Six steps to make Aloriq useful before adding more goals.</p>
      </div>

      <SetupStep number={1} title="Life Map scores" description="Update the domains that most need a current snapshot.">
        <div className="grid gap-4 xl:grid-cols-2">
          {domains.slice(0, 4).map((domain) => (
            <Card key={domain.id} className="bg-background">
              <CardHeader>
                <CardTitle className="text-base">{domain.name}</CardTitle>
                <CardDescription>Importance {domain.importanceScore} · Satisfaction {domain.satisfactionScore} · Risk {domain.riskScore}</CardDescription>
              </CardHeader>
              <CardContent><LifeDomainForm domain={domain} /></CardContent>
            </Card>
          ))}
        </div>
      </SetupStep>

      <SetupStep number={2} title="Choose top values" description="Pick up to five values that should shape active goals.">
        <TopValuesForm values={values} />
      </SetupStep>

      <SetupStep number={3} title="Add criteria for top values" description="Make values observable in real life.">
        {topValues.length ? <ValuesManager values={topValues} /> : <p className="text-sm text-muted-foreground">Choose top values first.</p>}
      </SetupStep>

      <SetupStep number={4} title="Create first draft goal" description="A draft can be incomplete. Activation has stricter requirements.">
        {firstGoal ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{firstGoal.title}</Badge>
            <Button asChild variant="outline"><Link href={`/goals/${firstGoal.id}`}>Open first goal</Link></Button>
          </div>
        ) : (
          <GoalForm domains={domains} needs={needs} values={values} />
        )}
      </SetupStep>

      <SetupStep number={5} title="Add recommended metric stack" description="Create the outcome, lead, risk, and alignment metrics suggested by the goal type.">
        {firstGoal ? <AddRecommendedMetricStackButton goalId={firstGoal.id} /> : <p className="text-sm text-muted-foreground">Create a draft goal first.</p>}
      </SetupStep>

      <SetupStep number={6} title="Add first weekly commitment" description="One commitment for this week is enough for setup.">
        {firstGoal ? (
          firstGoal.weeklyCommitments.length ? (
            <p className="text-sm text-muted-foreground">This week already has a commitment for the first goal.</p>
          ) : (
            <CommitmentForm goalId={firstGoal.id} />
          )
        ) : (
          <p className="text-sm text-muted-foreground">Create a draft goal first.</p>
        )}
      </SetupStep>

      <SetupCompletion ready={setupReady} />
    </div>
  );
}

function SetupStep({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge>{number}</Badge>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
