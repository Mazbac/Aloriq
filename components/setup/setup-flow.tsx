"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Value, ValueCriterion } from "@prisma/client";
import { completeSetup, saveTopValues, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ActionMessage } from "@/components/forms/form-parts";

type ValueWithCriteria = Value & { criteria?: ValueCriterion[] };

export function TopValuesForm({ values }: { values: ValueWithCriteria[] }) {
  const [selected, setSelected] = useState(values.filter((value) => value.rank).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).map((value) => value.id));
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      if (!checked) return current.filter((item) => item !== id);
      if (current.includes(id) || current.length >= 5) return current;
      return [...current, id];
    });
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => (
          <label key={value.id} className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
            <Checkbox checked={selected.includes(value.id)} onCheckedChange={(checked) => toggle(value.id, checked === true)} />
            <span>{value.name}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" disabled={isPending || selected.length === 0} onClick={() => startTransition(async () => setResult(await saveTopValues(selected)))}>
          {isPending ? "Saving..." : "Save top values"}
        </Button>
        <ActionMessage result={result} />
      </div>
    </div>
  );
}

export function SetupCompletion({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">Finish setup</div>
          <p className="text-sm text-muted-foreground">{ready ? "The core setup is ready." : "You can finish later, but a draft goal, metrics, and a weekly commitment make the dashboard useful."}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const next = await completeSetup();
                setResult(next);
                if (next.ok) router.push("/dashboard");
              })
            }
          >
            {isPending ? "Finishing..." : "Finish setup"}
          </Button>
          <ActionMessage result={result} />
        </div>
      </CardContent>
    </Card>
  );
}
