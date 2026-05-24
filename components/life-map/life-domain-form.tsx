"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LifeDomain } from "@prisma/client";
import { updateLifeDomain, type ActionResult } from "@/app/actions";
import { lifeDomainSchema } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, ActionMessage } from "@/components/forms/form-parts";

type FormValues = {
  id: string;
  satisfactionScore: number;
  importanceScore: number;
  riskScore: number;
  notes?: string;
};

export function LifeDomainForm({ domain }: { domain: LifeDomain }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(lifeDomainSchema),
    defaultValues: {
      id: domain.id,
      satisfactionScore: domain.satisfactionScore,
      importanceScore: domain.importanceScore,
      riskScore: domain.riskScore,
      notes: domain.notes ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => setResult(await updateLifeDomain(values)));
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Satisfaction" error={form.formState.errors.satisfactionScore?.message}>
          <Input type="number" min={1} max={10} {...form.register("satisfactionScore", { valueAsNumber: true })} />
        </Field>
        <Field label="Importance" error={form.formState.errors.importanceScore?.message}>
          <Input type="number" min={1} max={10} {...form.register("importanceScore", { valueAsNumber: true })} />
        </Field>
        <Field label="Risk" error={form.formState.errors.riskScore?.message}>
          <Input type="number" min={1} max={10} {...form.register("riskScore", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field label="Notes" error={form.formState.errors.notes?.message}>
        <Textarea {...form.register("notes")} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save scores"}</Button>
        <ActionMessage result={result} />
      </div>
    </form>
  );
}
