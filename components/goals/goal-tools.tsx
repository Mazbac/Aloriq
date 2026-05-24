"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommitmentStatus, GoalType, MetricDirection, MetricFrequency, MetricType, type BreakdownAssumption, type Metric } from "@prisma/client";
import { Plus } from "lucide-react";
import { activateGoal, addRecommendedMetricStack, runGoalBreakdown, saveCommitment, saveMetric, saveMetricEntry, updateCommitmentStatus, type ActionResult } from "@/app/actions";
import { breakdownTemplates } from "@/lib/breakdown/templates";
import { commitmentSchema, metricEntrySchema, metricSchema } from "@/lib/validations/schemas";
import { enumLabel, toDateInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, ActionMessage } from "@/components/forms/form-parts";

export function MetricForm({ goalId }: { goalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({
    resolver: zodResolver(metricSchema),
    defaultValues: { goalId, name: "", type: MetricType.OUTCOME, unit: "", targetValue: undefined, currentValue: undefined, direction: MetricDirection.INCREASE, frequency: MetricFrequency.WEEKLY, notes: "" },
  });
  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveMetric(values);
      setResult(next);
      if (next.ok) form.reset({ goalId, name: "", type: MetricType.OUTCOME, unit: "", targetValue: undefined, currentValue: undefined, direction: MetricDirection.INCREASE, frequency: MetricFrequency.WEEKLY, notes: "" });
    });
  }
  return (
    <Card>
      <CardHeader><CardTitle>Add metric</CardTitle><CardDescription>Track outcome, lead, risk, and alignment signals.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <Field label="Name" error={form.formState.errors.name?.message as string | undefined}><Input {...form.register("name")} /></Field>
          <Field label="Type"><EnumSelect value={form.watch("type")} values={Object.values(MetricType)} onChange={(value) => form.setValue("type", value as MetricType)} /></Field>
          <Field label="Unit"><Input {...form.register("unit")} /></Field>
          <Field label="Target value"><Input type="number" step="any" {...form.register("targetValue")} /></Field>
          <Field label="Current value"><Input type="number" step="any" {...form.register("currentValue")} /></Field>
          <Field label="Direction"><EnumSelect value={form.watch("direction")} values={Object.values(MetricDirection)} onChange={(value) => form.setValue("direction", value as MetricDirection)} /></Field>
          <Field label="Frequency"><EnumSelect value={form.watch("frequency")} values={Object.values(MetricFrequency)} onChange={(value) => form.setValue("frequency", value as MetricFrequency)} /></Field>
          <Field label="Notes" className="md:col-span-2"><Textarea {...form.register("notes")} /></Field>
          <div className="flex items-center gap-3 md:col-span-2"><Button disabled={isPending}><Plus className="size-4" />{isPending ? "Adding..." : "Add metric"}</Button><ActionMessage result={result} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MetricEntryForm({ metric, goalId }: { metric: Metric; goalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({ resolver: zodResolver(metricEntrySchema), defaultValues: { metricId: metric.id, goalId, value: "", entryDate: toDateInput(new Date()), note: "" } });
  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveMetricEntry(values);
      setResult(next);
      if (next.ok) form.reset({ metricId: metric.id, goalId, value: "", entryDate: toDateInput(new Date()), note: "" });
    });
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <Input type="number" step="any" placeholder="Value" {...form.register("value")} />
      <Input type="date" {...form.register("entryDate")} />
      <Input placeholder="Note" {...form.register("note")} />
      <Button size="sm" disabled={isPending}>Log</Button>
      <div className="sm:col-span-4">
        {form.formState.errors.value ? <p className="text-xs font-medium text-destructive">{form.formState.errors.value.message as string}</p> : null}
        <ActionMessage result={result} />
      </div>
    </form>
  );
}

export function AddRecommendedMetricStackButton({ goalId }: { goalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" disabled={isPending} onClick={() => startTransition(async () => setResult(await addRecommendedMetricStack(goalId)))}>
        {isPending ? "Adding..." : "Add recommended metric stack"}
      </Button>
      <ActionMessage result={result} />
    </div>
  );
}

export function ActivateGoalButton({ goalId, disabled, missing }: { goalId: string; disabled: boolean; missing: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="space-y-2">
      <Button type="button" disabled={disabled || isPending} onClick={() => startTransition(async () => setResult(await activateGoal(goalId)))}>
        {isPending ? "Activating..." : "Activate goal"}
      </Button>
      {disabled ? <p className="text-sm text-muted-foreground">Missing: {missing.join("; ")}</p> : null}
      <ActionMessage result={result} />
    </div>
  );
}

export function CommitmentForm({ goalId, suggested }: { goalId: string; suggested?: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({
    resolver: zodResolver(commitmentSchema),
    defaultValues: { goalId, weekStartDate: toDateInput(new Date()), statement: suggested ?? "", targetValue: undefined, actualValue: undefined, unit: "", status: CommitmentStatus.PLANNED, notes: "" },
  });
  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveCommitment(values);
      setResult(next);
      if (next.ok) form.reset({ goalId, weekStartDate: toDateInput(new Date()), statement: "", targetValue: undefined, actualValue: undefined, unit: "", status: CommitmentStatus.PLANNED, notes: "" });
    });
  }
  return (
    <Card>
      <CardHeader><CardTitle>Add weekly commitment</CardTitle><CardDescription>Only commitments for this week belong here.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <Field label="Statement" className="md:col-span-2" error={form.formState.errors.statement?.message as string | undefined}><Input {...form.register("statement")} /></Field>
          <Field label="Week start" error={form.formState.errors.weekStartDate?.message as string | undefined}><Input type="date" {...form.register("weekStartDate")} /></Field>
          <Field label="Target value"><Input type="number" step="any" {...form.register("targetValue")} /></Field>
          <Field label="Unit"><Input {...form.register("unit")} /></Field>
          <Field label="Notes"><Textarea {...form.register("notes")} /></Field>
          <div className="flex items-center gap-3 md:col-span-2"><Button disabled={isPending}>{isPending ? "Saving..." : "Save commitment"}</Button><ActionMessage result={result} /></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function BreakdownForm({ goalId, goalType, assumptions, targetDate }: { goalId: string; goalType: GoalType; assumptions: BreakdownAssumption[]; targetDate?: Date | null }) {
  const template = breakdownTemplates[goalType];
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const defaults = Object.fromEntries(assumptions.map((item) => [item.key, item.value]));
  if (targetDate && !defaults.targetDate) defaults.targetDate = toDateInput(targetDate);
  if (targetDate && !defaults.deadline) defaults.deadline = toDateInput(targetDate);
  const [values, setValues] = useState<Record<string, string>>(defaults);
  if (!template.assumptions.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Breakdown</CardTitle><CardDescription>This goal type has suggested metrics but no MVP breakdown calculator yet.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">{template.metrics.map((metric) => <span key={metric.name} className="rounded-md border px-2 py-1 text-sm">{metric.name}</span>)}</CardContent>
      </Card>
    );
  }
  function submit() {
    startTransition(async () => setResult(await runGoalBreakdown({ goalId, assumptions: values })));
  }
  return (
    <Card>
      <CardHeader><CardTitle>Run breakdown</CardTitle><CardDescription>Use simple assumptions to translate the goal into measurable pressure.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {template.assumptions.map((item) => (
            <Field key={item.key} label={`${item.label}${item.required ? " *" : ""}`} hint={item.placeholder}>
              <Input
                type={inputTypeForAssumption(item.key)}
                value={values[item.key] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))}
              />
            </Field>
          ))}
        </div>
        <div className="flex items-center gap-3"><Button type="button" onClick={submit} disabled={isPending}>{isPending ? "Running..." : "Run breakdown"}</Button><ActionMessage result={result} /></div>
      </CardContent>
    </Card>
  );
}

function inputTypeForAssumption(key: string) {
  const lower = key.toLowerCase();
  if (lower.includes("date") || lower.includes("deadline")) return "date";
  if (
    lower.includes("conversion") ||
    lower.includes("url") ||
    lower.includes("level") ||
    lower.includes("skill") ||
    lower.includes("method") ||
    lower.includes("behavior") ||
    lower.includes("ritual") ||
    lower.includes("friction")
  ) {
    return "text";
  }
  return "number";
}

export function CommitmentStatusForm({ id, goalId, status, actualValue, notes }: { id: string; goalId: string; status: CommitmentStatus; actualValue?: unknown; notes?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [nextStatus, setNextStatus] = useState(status);
  const [actual, setActual] = useState(actualValue == null ? "" : String(actualValue));
  const [nextNotes, setNextNotes] = useState(notes ?? "");
  function submit() {
    startTransition(async () =>
      setResult(await updateCommitmentStatus({ id, goalId, status: nextStatus, actualValue: actual ? Number(actual) : null, notes: nextNotes })),
    );
  }
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <EnumSelect value={nextStatus} values={Object.values(CommitmentStatus)} onChange={(value) => setNextStatus(value as CommitmentStatus)} />
      <Input type="number" step="any" placeholder="Actual" value={actual} onChange={(event) => setActual(event.target.value)} />
      <Input placeholder="Notes" value={nextNotes} onChange={(event) => setNextNotes(event.target.value)} />
      <Button type="button" size="sm" disabled={isPending} onClick={submit}>Update</Button>
      <div className="sm:col-span-4"><ActionMessage result={result} /></div>
    </div>
  );
}

function EnumSelect({ value, values, onChange }: { value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{enumLabel(item)}</SelectItem>)}</SelectContent>
    </Select>
  );
}
