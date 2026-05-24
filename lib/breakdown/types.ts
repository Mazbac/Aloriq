import { GoalType } from "@prisma/client";

export type AssumptionInput = Record<string, string | undefined>;

export type BreakdownOutputItem = {
  label: string;
  value: string;
  unit?: string;
  period?: string;
  explanation?: string;
};

export type SuggestedMetric = {
  name: string;
  type: "OUTCOME" | "LEAD" | "RISK" | "ALIGNMENT";
  unit?: string;
  direction: "INCREASE" | "DECREASE" | "MAINTAIN" | "BOOLEAN" | "SCORE";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
};

export type BreakdownResult = {
  missing: string[];
  outputs: BreakdownOutputItem[];
  suggestedCommitment?: string;
  suggestedMetrics: SuggestedMetric[];
};

export type BreakdownTemplate = {
  type: GoalType;
  assumptions: { key: string; label: string; unit?: string; required?: boolean; placeholder?: string }[];
  metrics: SuggestedMetric[];
};
