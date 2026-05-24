import Link from "next/link";
import { AlertTriangle, ArrowDownUp } from "lucide-react";
import { getDemoUser, prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LifeDomainForm } from "@/components/life-map/life-domain-form";

export const dynamic = "force-dynamic";

export default async function LifeMapPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const user = await getDemoUser();
  const params = await searchParams;
  const sort = params.sort ?? "risk";
  const orderBy =
    sort === "importance"
      ? { importanceScore: "desc" as const }
      : sort === "satisfaction"
        ? { satisfactionScore: "asc" as const }
        : { riskScore: "desc" as const };
  const domains = await prisma.lifeDomain.findMany({
    where: { userId: user.id },
    orderBy,
    include: { goals: { where: { status: "ACTIVE" }, select: { id: true } } },
  });

  const neglected = domains.filter((domain) => domain.importanceScore >= 8 && domain.satisfactionScore <= 5);
  const highRisk = domains.filter((domain) => domain.riskScore >= 7);
  const noActiveGoals = domains.filter((domain) => domain.goals.length === 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard title="Needs attention" count={neglected.length} text="Importance is high while satisfaction is low." />
        <InsightCard title="Potential risk" count={highRisk.length} text="Risk is elevated in this snapshot." />
        <InsightCard title="No active goal" count={noActiveGoals.length} text="These domains may still be fine; they are simply uncovered." />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Life domains</h2>
          <p className="text-sm text-muted-foreground">Score current reality before choosing more goals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["risk", "importance", "satisfaction"].map((item) => (
            <Button key={item} asChild variant={sort === item ? "default" : "outline"} size="sm">
              <Link href={`/life-map?sort=${item}`}>
                <ArrowDownUp className="size-4" />
                {item}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {domains.map((domain) => {
          const flagged = domain.importanceScore >= 8 && domain.satisfactionScore <= 5;
          return (
            <Card key={domain.id} className={flagged || domain.riskScore >= 7 ? "border-primary/40" : undefined}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{domain.name}</CardTitle>
                    <CardDescription>{domain.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {flagged ? <Badge variant="secondary">Needs attention</Badge> : null}
                    {domain.riskScore >= 7 ? <Badge variant="destructive">Potential risk</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Score label="Satisfaction" value={domain.satisfactionScore} />
                  <Score label="Importance" value={domain.importanceScore} />
                  <Score label="Risk" value={domain.riskScore} />
                </div>
                {domain.notes ? <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{domain.notes}</p> : null}
                <LifeDomainForm domain={domain} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({ title, count, text }: { title: string; count: number; text: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{count}</div>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
