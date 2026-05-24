"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GoalStatus, GoalType, type Goal, type GoalCriterion, type GoalNeed, type GoalValue, type LifeDomain, type Need, type Value } from "@prisma/client";
import { saveGoal, type ActionResult } from "@/app/actions";
import { enumLabel, toDateInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, ActionMessage } from "@/components/forms/form-parts";

type GoalWithRelations = Goal & {
  needs: GoalNeed[];
  values: GoalValue[];
  criteria: GoalCriterion[];
};

const goalFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string(),
  lifeDomainId: z.string().min(1, "Life domain is required."),
  goalType: z.nativeEnum(GoalType),
  status: z.nativeEnum(GoalStatus),
  startDate: z.string(),
  targetDate: z.string(),
  whyNow: z.string(),
  successDefinition: z.string().trim().min(1, "Success definition is required."),
  tradeOffs: z.string(),
  notWorthItIf: z.string(),
  externalWorkUrl: z.string().url("Use a valid URL.").optional().or(z.literal("")),
  needIds: z.array(z.string()),
  valueIds: z.array(z.string()),
  criteriaText: z.string(),
});

type FormValues = z.infer<typeof goalFormSchema>;

export function GoalForm({ goal, domains, needs, values }: { goal?: GoalWithRelations; domains: LifeDomain[]; needs: Need[]; values: Value[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      id: goal?.id,
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      lifeDomainId: goal?.lifeDomainId ?? domains[0]?.id ?? "",
      goalType: goal?.goalType ?? GoalType.CUSTOM,
      status: goal?.status ?? GoalStatus.DRAFT,
      startDate: toDateInput(goal?.startDate),
      targetDate: toDateInput(goal?.targetDate),
      whyNow: goal?.whyNow ?? "",
      successDefinition: goal?.successDefinition ?? "",
      tradeOffs: goal?.tradeOffs ?? "",
      notWorthItIf: goal?.notWorthItIf ?? "",
      externalWorkUrl: goal?.externalWorkUrl ?? "",
      needIds: goal?.needs.map((item) => item.needId) ?? [],
      valueIds: goal?.values.map((item) => item.valueId) ?? [],
      criteriaText: goal?.criteria.map((item) => item.statement).join("\n") ?? "",
    },
  });

  function toggleArray(name: "needIds" | "valueIds", id: string, checked: boolean) {
    const current = form.getValues(name);
    form.setValue(name, checked ? [...current, id] : current.filter((item) => item !== id), { shouldDirty: true });
  }

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      criteria: values.criteriaText.split("\n").map((line) => line.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const next = await saveGoal(payload);
      setResult(next);
      if (next.ok && next.id) router.push(`/goals/${next.id}`);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal logic</CardTitle>
          <CardDescription>Keep this above execution tools: what, why, measure, cost.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Title" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <Field label="Life domain" error={form.formState.errors.lifeDomainId?.message}>
            <Select value={form.watch("lifeDomainId")} onValueChange={(value) => form.setValue("lifeDomainId", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{domains.map((domain) => <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Goal type" error={form.formState.errors.goalType?.message}>
            <Select value={form.watch("goalType")} onValueChange={(value) => form.setValue("goalType", value as GoalType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.values(GoalType).map((type) => <SelectItem key={type} value={type}>{enumLabel(type)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status" error={form.formState.errors.status?.message} hint="Active requires success definition, at least one value, and at least one metric.">
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as GoalStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.values(GoalStatus).map((status) => <SelectItem key={status} value={status}>{enumLabel(status)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Start date" error={form.formState.errors.startDate?.message as string | undefined}>
            <Input type="date" {...form.register("startDate")} />
          </Field>
          <Field label="Target date" error={form.formState.errors.targetDate?.message as string | undefined}>
            <Input type="date" {...form.register("targetDate")} />
          </Field>
          <Field label="External work URL" error={form.formState.errors.externalWorkUrl?.message as string | undefined} hint="Notion, Todoist, GitHub, Figma, Google Sheet, CRM, MacroFactor, Calendar.">
            <Input placeholder="https://..." {...form.register("externalWorkUrl")} />
          </Field>
          <Field label="Description" className="md:col-span-2" error={form.formState.errors.description?.message as string | undefined}>
            <Textarea {...form.register("description")} />
          </Field>
          <Field label="Why now?" className="md:col-span-2" error={form.formState.errors.whyNow?.message as string | undefined}>
            <Textarea {...form.register("whyNow")} />
          </Field>
          <Field label="Success definition" className="md:col-span-2" error={form.formState.errors.successDefinition?.message}>
            <Textarea {...form.register("successDefinition")} />
          </Field>
          <Field label="Trade-offs" className="md:col-span-2" error={form.formState.errors.tradeOffs?.message as string | undefined}>
            <Textarea {...form.register("tradeOffs")} />
          </Field>
          <Field label="Not worth it if" className="md:col-span-2" error={form.formState.errors.notWorthItIf?.message as string | undefined}>
            <Textarea {...form.register("notWorthItIf")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Needs, values, criteria</CardTitle>
          <CardDescription>Connect the goal to reasons that can be reviewed later.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium">Needs</div>
            <div className="grid gap-2">
              {needs.map((need) => (
                <label key={need.id} className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm">
                  <Checkbox checked={form.watch("needIds").includes(need.id)} onCheckedChange={(checked) => toggleArray("needIds", need.id, checked === true)} />
                  {need.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium">Values</div>
            <div className="grid gap-2">
              {values.map((value) => (
                <label key={value.id} className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm">
                  <Checkbox checked={form.watch("valueIds").includes(value.id)} onCheckedChange={(checked) => toggleArray("valueIds", value.id, checked === true)} />
                  {value.rank ? `#${value.rank} ` : ""}{value.name}
                </label>
              ))}
            </div>
          </div>
          <Field label="Goal-specific criteria" className="lg:col-span-2" hint="One criterion per line." error={form.formState.errors.criteriaText?.message as string | undefined}>
            <Textarea {...form.register("criteriaText")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button disabled={isPending}>{isPending ? "Saving..." : "Save goal"}</Button>
        <ActionMessage result={result} />
      </div>
    </form>
  );
}
