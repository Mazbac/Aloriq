import { CommitmentStatus, GoalStatus, GoalType, MetricDirection, MetricFrequency, MetricType, ReviewDecision } from "@prisma/client";
import { z } from "zod";
import { nullableNumberSchema, optionalDateSchema, optionalUrlSchema, requiredNumberSchema, scoreSchema, text } from "./common";

export const lifeDomainSchema = z.object({
  id: z.string(),
  satisfactionScore: scoreSchema,
  importanceScore: scoreSchema,
  riskScore: scoreSchema,
  notes: text,
});

export const valueSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required."),
  description: text,
  rank: z.preprocess((value) => (value === "" || value == null ? undefined : value), z.coerce.number().int().positive().optional()),
});

export const criterionSchema = z.object({
  id: z.string().optional(),
  valueId: z.string(),
  statement: z.string().trim().min(1, "Criterion is required."),
  isHealthy: z.boolean().default(true),
  notes: text,
});

export const goalSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required."),
  description: text,
  lifeDomainId: z.string().min(1, "Life domain is required."),
  goalType: z.nativeEnum(GoalType),
  status: z.nativeEnum(GoalStatus).default(GoalStatus.DRAFT),
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
  whyNow: text,
  successDefinition: z.string().trim().optional().transform((value) => value ?? ""),
  tradeOffs: text,
  notWorthItIf: text,
  externalWorkUrl: optionalUrlSchema,
  needIds: z.array(z.string()).default([]),
  valueIds: z.array(z.string()).default([]),
  criteria: z.array(z.string().trim()).default([]),
});

export const metricSchema = z.object({
  goalId: z.string(),
  name: z.string().trim().min(1, "Metric name is required."),
  type: z.nativeEnum(MetricType),
  unit: text,
  targetValue: nullableNumberSchema,
  currentValue: nullableNumberSchema,
  direction: z.nativeEnum(MetricDirection),
  frequency: z.nativeEnum(MetricFrequency),
  notes: text,
});

export const metricEntrySchema = z.object({
  metricId: z.string(),
  goalId: z.string(),
  value: requiredNumberSchema,
  entryDate: optionalDateSchema.refine(Boolean, "Date is required."),
  note: text,
});

export const commitmentSchema = z.object({
  goalId: z.string(),
  weekStartDate: optionalDateSchema.refine(Boolean, "Week start date is required."),
  statement: z.string().trim().min(1, "Commitment is required."),
  targetValue: nullableNumberSchema,
  actualValue: nullableNumberSchema,
  unit: text,
  status: z.nativeEnum(CommitmentStatus).default(CommitmentStatus.PLANNED),
  notes: text,
});

export const reviewSchema = z.object({
  periodStart: optionalDateSchema.refine(Boolean, "Period start is required."),
  periodEnd: optionalDateSchema.refine(Boolean, "Period end is required."),
  wins: text,
  misses: text,
  blockers: text,
  lessons: text,
  domainDamage: text,
  continueAdjustPauseKill: text,
  goalReviews: z.array(
    z.object({
      goalId: z.string(),
      progressSummary: text,
      alignmentScore: scoreSchema,
      costScore: scoreSchema,
      confidenceScore: scoreSchema,
      decision: z.nativeEnum(ReviewDecision),
      decisionReason: text,
      stillWantThis: text,
      realityVsFantasy: text,
      valuesConnection: text,
      costAcceptable: text,
      domainDamage: text,
      updateStatus: z.boolean().default(false),
    }),
  ),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Use a valid email.").optional().or(z.literal("")),
  preferredWeekStartDay: z.coerce.number().int().min(0).max(6),
  currency: z.string().trim().min(1, "Currency label is required."),
});

export const breakdownAssumptionSchema = z.object({
  goalId: z.string(),
  assumptions: z.record(z.string().trim()),
});
