import Link from "next/link";
import { GoalStatus, GoalType } from "@prisma/client";
import { Plus } from "lucide-react";
import { getDemoUser, prisma } from "@/lib/prisma";
import { currentWeekRange } from "@/lib/goals/activation";
import { enumLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalCard } from "@/components/goals/goal-card";

export const dynamic = "force-dynamic";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ status?: string; domain?: string; type?: string }> }) {
  const user = await getDemoUser();
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const params = await searchParams;
  const domains = await prisma.lifeDomain.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });
  const goals = await prisma.goal.findMany({
    where: {
      userId: user.id,
      status: params.status && params.status !== "ALL" ? (params.status as GoalStatus) : undefined,
      lifeDomainId: params.domain && params.domain !== "ALL" ? params.domain : undefined,
      goalType: params.type && params.type !== "ALL" ? (params.type as GoalType) : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      lifeDomain: true,
      values: { include: { value: true } },
      metrics: true,
      weeklyCommitments: { where: { weekStartDate: { gte: week.start, lt: week.end } }, orderBy: { weekStartDate: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Goals</h2>
          <p className="text-sm text-muted-foreground">Structured decisions, not a task list.</p>
        </div>
        <Button asChild><Link href="/goals/new"><Plus className="size-4" />New goal</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Review goals by status, domain, or type.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <FilterGroup label="Status" base="/goals" param="status" current={params.status ?? "ALL"} options={["ALL", ...Object.values(GoalStatus)]} />
          <FilterGroup label="Type" base="/goals" param="type" current={params.type ?? "ALL"} options={["ALL", ...Object.values(GoalType)]} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Domain</span>
            <Button asChild size="sm" variant={!params.domain || params.domain === "ALL" ? "default" : "outline"}><Link href="/goals">All</Link></Button>
            {domains.map((domain) => (
              <Button key={domain.id} asChild size="sm" variant={params.domain === domain.id ? "default" : "outline"}>
                <Link href={`/goals?domain=${domain.id}`}>{domain.name}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {goals.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No goals yet</CardTitle>
            <CardDescription>Complete Life Map and Values, then create a goal worth measuring.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/goals/new">Create first goal</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterGroup({ label, param, current, options }: { label: string; base: string; param: string; current: string; options: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((option) => (
        <Button key={option} asChild size="sm" variant={current === option ? "default" : "outline"}>
          <Link href={option === "ALL" ? "/goals" : `/goals?${param}=${option}`}>{option === "ALL" ? "All" : enumLabel(option)}</Link>
        </Button>
      ))}
    </div>
  );
}
