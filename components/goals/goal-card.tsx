import Link from "next/link";
import type { Goal, LifeDomain, Metric, Value, GoalValue, WeeklyCommitment } from "@prisma/client";
import { MetricType } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { enumLabel, formatDate } from "@/lib/utils";

type GoalCardData = Goal & {
  lifeDomain: LifeDomain;
  values: (GoalValue & { value: Value })[];
  metrics: Metric[];
  weeklyCommitments: WeeklyCommitment[];
};

export function metricCompleteness(metrics: Metric[]) {
  const present = new Set(metrics.map((metric) => metric.type));
  const all = Object.values(MetricType);
  const missing = all.filter((type) => !present.has(type));
  return { missing, percent: ((all.length - missing.length) / all.length) * 100 };
}

export function GoalCard({ goal }: { goal: GoalCardData }) {
  const completeness = metricCompleteness(goal.metrics);
  const commitment = goal.weeklyCommitments[0];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{goal.title}</CardTitle>
            <CardDescription>Target: {formatDate(goal.targetDate)}</CardDescription>
          </div>
          <Badge variant={goal.status === "ACTIVE" ? "default" : "secondary"}>{enumLabel(goal.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{goal.lifeDomain.name}</Badge>
          <Badge variant="secondary">{enumLabel(goal.goalType)}</Badge>
          {goal.values.slice(0, 3).map((item) => <Badge key={item.valueId} variant="outline">{item.value.name}</Badge>)}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Metric stack</span>
            <span>{Math.round(completeness.percent)}%</span>
          </div>
          <Progress value={completeness.percent} />
          {completeness.missing.length ? <p className="text-xs text-muted-foreground">Missing {completeness.missing.map(enumLabel).join(", ")}.</p> : null}
        </div>
        <div className="rounded-md bg-muted p-3 text-sm">
          <span className="font-medium">Weekly commitment: </span>
          {commitment ? `${commitment.statement} (${enumLabel(commitment.status)})` : "None set"}
        </div>
        <Button asChild variant="outline">
          <Link href={`/goals/${goal.id}`}>Open goal <ArrowRight className="size-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
