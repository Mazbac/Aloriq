import { GoalStatus, MetricType, type CommitmentStatus, type Metric } from "@prisma/client";
import { startOfWeek } from "@/lib/utils";

export type ActivationGoalInput = {
  status?: GoalStatus;
  successDefinition?: string | null;
  connectedValueCount: number;
  metrics: Pick<Metric, "type">[];
  currentWeekCommitmentCount: number;
};

export type ActivationChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
};

export function metricStackMissing(metrics: Pick<Metric, "type">[]) {
  const present = new Set(metrics.map((metric) => metric.type));
  return Object.values(MetricType).filter((type) => !present.has(type));
}

export function activationChecklist(goal: ActivationGoalInput): ActivationChecklistItem[] {
  const missingMetricTypes = metricStackMissing(goal.metrics);
  return [
    { key: "successDefinition", label: "Success definition written", complete: Boolean(goal.successDefinition?.trim()) },
    { key: "values", label: "At least one value connected", complete: goal.connectedValueCount > 0 },
    {
      key: "metrics",
      label: missingMetricTypes.length ? `Complete metric stack missing ${missingMetricTypes.join(", ")}` : "Complete metric stack",
      complete: missingMetricTypes.length === 0,
    },
    { key: "commitment", label: "At least one current-week commitment", complete: goal.currentWeekCommitmentCount > 0 },
  ];
}

export function activationErrors(goal: ActivationGoalInput) {
  return activationChecklist(goal).filter((item) => !item.complete).map((item) => item.label);
}

export function assertActivatable(goal: ActivationGoalInput) {
  if (goal.status !== GoalStatus.ACTIVE) return;
  const errors = activationErrors(goal);
  if (errors.length) throw new Error(`Active goals require: ${errors.join("; ")}.`);
}

export function currentWeekRange(date = new Date(), weekStartsOn = 1) {
  const start = startOfWeek(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

export function isCurrentWeek(date: Date, now = new Date(), weekStartsOn = 1) {
  const { start, end } = currentWeekRange(now, weekStartsOn);
  return date >= start && date < end;
}

export function commitmentIsOpen(status: CommitmentStatus) {
  return status === "PLANNED" || status === "PARTIAL";
}
