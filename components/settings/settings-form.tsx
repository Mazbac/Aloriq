"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@prisma/client";
import { updateSettings, type ActionResult } from "@/app/actions";
import { settingsSchema } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, ActionMessage } from "@/components/forms/form-parts";

const days = [
  ["0", "Sunday"],
  ["1", "Monday"],
  ["2", "Tuesday"],
  ["3", "Wednesday"],
  ["4", "Thursday"],
  ["5", "Friday"],
  ["6", "Saturday"],
];

export function SettingsForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const form = useForm({ resolver: zodResolver(settingsSchema), defaultValues: { name: user.name, email: user.email ?? "", preferredWeekStartDay: user.preferredWeekStartDay } });
  function onSubmit(values: unknown) {
    startTransition(async () => setResult(await updateSettings(values)));
  }
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Demo settings</CardTitle>
        <CardDescription>MVP1 uses a seeded local demo user. Auth is intentionally out of scope.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Name" error={form.formState.errors.name?.message as string | undefined}><Input {...form.register("name")} /></Field>
          <Field label="Email" error={form.formState.errors.email?.message as string | undefined}><Input type="email" {...form.register("email")} /></Field>
          <Field label="Preferred week start">
            <Select value={String(form.watch("preferredWeekStartDay"))} onValueChange={(value) => form.setValue("preferredWeekStartDay", Number(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{days.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">To reset demo data safely, run <code>npm run db:reset</code> locally. There is no in-app destructive reset button in MVP1.</div>
          <div className="flex items-center gap-3"><Button disabled={isPending}>{isPending ? "Saving..." : "Save settings"}</Button><ActionMessage result={result} /></div>
        </form>
      </CardContent>
    </Card>
  );
}
