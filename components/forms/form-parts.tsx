"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ label, error, children, hint, className }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export function ActionMessage({ result }: { result?: { ok: boolean; message?: string } | null }) {
  if (!result?.message) return null;
  return <p className={cn("text-sm", result.ok ? "text-primary" : "text-destructive")}>{result.message}</p>;
}
