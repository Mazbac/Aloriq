"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReviewDecision, type Goal, type Metric, type MetricEntry, type WeeklyCommitment } from "@prisma/client";
import { saveReview, type ActionResult } from "@/app/actions";
import { reviewSchema } from "@/lib/validations/schemas";
import { decimalToNumber, enumLabel, toDateInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, ActionMessage } from "@/components/forms/form-parts";

type ReviewGoal = Goal & {
  metrics: (Metric & { entries: MetricEntry[] })[];
  weeklyCommitments: WeeklyCommitment[];
};

export function ReviewForm({ goals, periodStart, periodEnd }: { goals: ReviewGoal[]; periodStart: Date; periodEnd: Date }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      periodStart: toDateInput(periodStart),
      periodEnd: toDateInput(periodEnd),
      wins: "",
      misses: "",
      blockers: "",
      lessons: "",
      domainDamage: "",
      continueAdjustPauseKill: "",
      goalReviews: goals.map((goal) => ({
        goalId: goal.id,
        progressSummary: "",
        alignmentScore: 7,
        costScore: 5,
        confidenceScore: 7,
        decision: ReviewDecision.CONTINUE,
        decisionReason: "",
        stillWantThis: "",
        realityVsFantasy: "",
        valuesConnection: "",
        costAcceptable: "",
        domainDamage: "",
        updateStatus: false,
      })),
    },
  });

  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveReview(values);
      setResult(next);
      if (next.ok && next.id) router.push(`/reviews/${next.id}`);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly review</CardTitle>
          <CardDescription>Review real signals, costs, and whether active goals still deserve commitment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Period start" error={form.formState.errors.periodStart?.message as string | undefined}><Input type="date" {...form.register("periodStart")} /></Field>
          <Field label="Period end" error={form.formState.errors.periodEnd?.message as string | undefined}><Input type="date" {...form.register("periodEnd")} /></Field>
          <Field label="Wins"><Textarea {...form.register("wins")} /></Field>
          <Field label="Misses"><Textarea {...form.register("misses")} /></Field>
          <Field label="Blockers"><Textarea {...form.register("blockers")} /></Field>
          <Field label="Lessons"><Textarea {...form.register("lessons")} /></Field>
          <Field label="Domain damage" className="md:col-span-2"><Textarea {...form.register("domainDamage")} /></Field>
          <Field label="Continue, adjust, pause, kill summary" className="md:col-span-2"><Textarea {...form.register("continueAdjustPauseKill")} /></Field>
        </CardContent>
      </Card>

      {goals.length ? goals.map((goal, index) => {
        const decision = form.watch(`goalReviews.${index}.decision`);
        const canUpdate = decision === ReviewDecision.PAUSE || decision === ReviewDecision.KILL || decision === ReviewDecision.COMPLETE;
        return (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{goal.title}</CardTitle>
                  <CardDescription>{goal.successDefinition}</CardDescription>
                </div>
                {goal.externalWorkUrl ? <Button asChild variant="outline" size="sm"><a href={goal.externalWorkUrl} target="_blank" rel="noreferrer">Open work tool</a></Button> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Info title="Latest metrics" items={goal.metrics.map((metric) => `${metric.name}: ${decimalToNumber(metric.entries[0]?.value ?? metric.currentValue) ?? "-"} ${metric.unit ?? ""}`)} />
                <Info title="Weekly commitments" items={goal.weeklyCommitments.map((commitment) => `${commitment.statement} (${enumLabel(commitment.status)})`)} />
                <Info title="Trade-offs" items={[goal.tradeOffs || "No trade-offs written."]} />
                <Info title="Not worth it if" items={[goal.notWorthItIf || "No kill condition written."]} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Alignment score"><Input type="number" min={1} max={10} {...form.register(`goalReviews.${index}.alignmentScore`, { valueAsNumber: true })} /></Field>
                <Field label="Cost score"><Input type="number" min={1} max={10} {...form.register(`goalReviews.${index}.costScore`, { valueAsNumber: true })} /></Field>
                <Field label="Confidence score"><Input type="number" min={1} max={10} {...form.register(`goalReviews.${index}.confidenceScore`, { valueAsNumber: true })} /></Field>
              </div>
              <Field label="Progress summary"><Textarea {...form.register(`goalReviews.${index}.progressSummary`)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Decision">
                  <Select value={decision} onValueChange={(value) => form.setValue(`goalReviews.${index}.decision`, value as ReviewDecision)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.values(ReviewDecision).map((item) => <SelectItem key={item} value={item}>{enumLabel(item)}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                {canUpdate ? (
                  <label className="flex items-center gap-2 self-end rounded-md border bg-background p-3 text-sm">
                    <Checkbox checked={form.watch(`goalReviews.${index}.updateStatus`)} onCheckedChange={(checked) => form.setValue(`goalReviews.${index}.updateStatus`, checked === true)} />
                    Update goal status to {enumLabel(decision)}
                  </label>
                ) : null}
              </div>
              <Field label="Decision reason"><Textarea {...form.register(`goalReviews.${index}.decisionReason`)} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Do I still want this?"><Textarea {...form.register(`goalReviews.${index}.stillWantThis`)} /></Field>
                <Field label="Reality or fantasy?"><Textarea {...form.register(`goalReviews.${index}.realityVsFantasy`)} /></Field>
                <Field label="Still connected to values?"><Textarea {...form.register(`goalReviews.${index}.valuesConnection`)} /></Field>
                <Field label="Is the cost acceptable?"><Textarea {...form.register(`goalReviews.${index}.costAcceptable`)} /></Field>
                <Field label="Damage to another domain?" className="md:col-span-2"><Textarea {...form.register(`goalReviews.${index}.domainDamage`)} /></Field>
              </div>
            </CardContent>
          </Card>
        );
      }) : (
        <Card><CardHeader><CardTitle>No active goals</CardTitle><CardDescription>Create or activate a goal before starting a weekly review.</CardDescription></CardHeader></Card>
      )}

      <div className="flex items-center gap-3">
        <Button disabled={isPending || goals.length === 0}>{isPending ? "Saving..." : "Save review"}</Button>
        <ActionMessage result={result} />
      </div>
    </form>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="flex flex-col gap-1">
        {items.length ? items.map((item) => <span key={item} className="text-sm text-muted-foreground">{item}</span>) : <span className="text-sm text-muted-foreground">None.</span>}
      </div>
    </div>
  );
}
