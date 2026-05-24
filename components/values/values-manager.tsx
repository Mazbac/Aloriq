"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Value, ValueCriterion } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCriterion, deleteValue, saveCriterion, saveValue, type ActionResult } from "@/app/actions";
import { criterionSchema, valueSchema } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, ActionMessage } from "@/components/forms/form-parts";

type ValueWithCriteria = Value & { criteria: ValueCriterion[] };

export function ValuesManager({ values }: { values: ValueWithCriteria[] }) {
  const topValues = useMemo(() => values.filter((value) => value.rank).slice(0, 5), [values]);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Values and criteria</h2>
          <p className="text-sm text-muted-foreground">Define what proves a value is present in real life.</p>
        </div>
        <ValueDialog />
      </div>

      {topValues.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Top values</CardTitle>
            <CardDescription>Ranked values are treated as current priorities.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {topValues.map((value) => (
              <Badge key={value.id} variant="secondary">#{value.rank} {value.name}</Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {values.map((value) => (
          <Card key={value.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {value.name}
                    {value.rank ? <Badge variant="secondary">Top #{value.rank}</Badge> : null}
                  </CardTitle>
                  <CardDescription>{value.description || "No description yet."}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <ValueDialog value={value} />
                  <DeleteButton onDelete={() => deleteValue(value.id)} label="Delete value" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">{value.criteria.length} criteria</div>
              <div className="space-y-2">
                {value.criteria.map((criterion) => (
                  <div key={criterion.id} className="rounded-md border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{criterion.statement}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant={criterion.isHealthy ? "secondary" : "outline"}>{criterion.isHealthy ? "Healthy" : "Potentially unhealthy"}</Badge>
                          {criterion.notes ? <span className="text-xs text-muted-foreground">{criterion.notes}</span> : null}
                        </div>
                      </div>
                      <DeleteButton onDelete={() => deleteCriterion(criterion.id)} label="Delete criterion" compact />
                    </div>
                  </div>
                ))}
              </div>
              <CriterionForm valueId={value.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ValueDialog({ value }: { value?: Value }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={value ? "outline" : "default"} size={value ? "icon" : "default"} aria-label={value ? "Edit value" : "Add value"}>
          {value ? <Pencil className="size-4" /> : <Plus className="size-4" />}
          {!value ? "Add value" : null}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{value ? "Edit value" : "Add value"}</DialogTitle>
          <DialogDescription>Rank values that should influence active goals.</DialogDescription>
        </DialogHeader>
        <ValueForm value={value} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ValueForm({ value, onSaved }: { value?: Value; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({ resolver: zodResolver(valueSchema), defaultValues: { id: value?.id, name: value?.name ?? "", description: value?.description ?? "", rank: value?.rank ?? undefined } });
  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveValue(values);
      setResult(next);
      if (next.ok) onSaved();
    });
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Name" error={form.formState.errors.name?.message as string | undefined}>
        <Input {...form.register("name")} />
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message as string | undefined}>
        <Textarea {...form.register("description")} />
      </Field>
      <Field label="Rank" error={form.formState.errors.rank?.message as string | undefined} hint="Optional. Lower numbers appear as top values.">
        <Input type="number" min={1} {...form.register("rank")} />
      </Field>
      <div className="flex items-center gap-3">
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save value"}</Button>
        <ActionMessage result={result} />
      </div>
    </form>
  );
}

function CriterionForm({ valueId }: { valueId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({
    resolver: zodResolver(criterionSchema),
    defaultValues: { valueId, statement: "", isHealthy: true, notes: "" },
  });
  function onSubmit(values: unknown) {
    startTransition(async () => {
      const next = await saveCriterion(values);
      setResult(next);
      if (next.ok) form.reset({ valueId, statement: "", isHealthy: true, notes: "" });
    });
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 rounded-md bg-muted p-3">
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span>How would you know this value is present?</span>
        <span>What would prove this in real life?</span>
        <span>What would violate this value?</span>
        <span>What is the fake or unhealthy version?</span>
      </div>
      <Field label="Criterion" error={form.formState.errors.statement?.message as string | undefined}>
        <Input {...form.register("statement")} />
      </Field>
      <div className="flex items-center gap-2">
        <Checkbox checked={form.watch("isHealthy")} onCheckedChange={(checked) => form.setValue("isHealthy", checked === true)} />
        <span className="text-sm">Healthy expression</span>
      </div>
      <Field label="Notes" error={form.formState.errors.notes?.message as string | undefined}>
        <Textarea className="min-h-16" {...form.register("notes")} />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={isPending}>{isPending ? "Adding..." : "Add criterion"}</Button>
        <ActionMessage result={result} />
      </div>
    </form>
  );
}

function DeleteButton({ onDelete, label, compact }: { onDelete: () => Promise<ActionResult>; label: string; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon" : "icon"}
      disabled={isPending}
      aria-label={label}
      onClick={() => {
        if (confirm(`${label}?`)) startTransition(async () => { await onDelete(); });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
