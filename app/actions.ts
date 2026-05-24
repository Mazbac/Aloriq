"use server";

import { GoalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, getDemoUser } from "@/lib/prisma";
import { runBreakdown } from "@/lib/breakdown";
import { breakdownTemplates } from "@/lib/breakdown/templates";
import { assertActivatable, currentWeekRange } from "@/lib/goals/activation";
import { statusForReviewDecision } from "@/lib/reviews/decisions";
import {
  breakdownAssumptionSchema,
  commitmentSchema,
  criterionSchema,
  goalSchema,
  lifeDomainSchema,
  metricEntrySchema,
  metricSchema,
  reviewSchema,
  settingsSchema,
  valueSchema,
} from "@/lib/validations/schemas";

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; message: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateApp() {
  ["/dashboard", "/life-map", "/values", "/goals", "/reviews", "/settings"].forEach((path) => revalidatePath(path));
}

export async function updateLifeDomain(input: unknown): Promise<ActionResult> {
  try {
    const data = lifeDomainSchema.parse(input);
    await prisma.lifeDomain.update({
      where: { id: data.id },
      data: {
        satisfactionScore: data.satisfactionScore,
        importanceScore: data.importanceScore,
        riskScore: data.riskScore,
        notes: data.notes,
      },
    });
    revalidateApp();
    return { ok: true, message: "Life domain updated." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveValue(input: unknown): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    const data = valueSchema.parse(input);
    const value = data.id
      ? await prisma.value.update({ where: { id: data.id }, data: { name: data.name, description: data.description, rank: data.rank } })
      : await prisma.value.create({ data: { userId: user.id, name: data.name, description: data.description, rank: data.rank } });
    revalidateApp();
    return { ok: true, id: value.id, message: "Value saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function deleteValue(id: string): Promise<ActionResult> {
  try {
    await prisma.value.delete({ where: { id } });
    revalidateApp();
    return { ok: true, message: "Value deleted." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveCriterion(input: unknown): Promise<ActionResult> {
  try {
    const data = criterionSchema.parse(input);
    const criterion = data.id
      ? await prisma.valueCriterion.update({ where: { id: data.id }, data: { statement: data.statement, isHealthy: data.isHealthy, notes: data.notes } })
      : await prisma.valueCriterion.create({ data: { valueId: data.valueId, statement: data.statement, isHealthy: data.isHealthy, notes: data.notes } });
    revalidateApp();
    return { ok: true, id: criterion.id, message: "Criterion saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function deleteCriterion(id: string): Promise<ActionResult> {
  try {
    await prisma.valueCriterion.delete({ where: { id } });
    revalidateApp();
    return { ok: true, message: "Criterion deleted." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveTopValues(valueIds: string[]): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    await prisma.$transaction(async (tx) => {
      await tx.value.updateMany({ where: { userId: user.id }, data: { rank: null } });
      for (const [index, id] of valueIds.slice(0, 5).entries()) {
        await tx.value.update({ where: { id }, data: { rank: index + 1 } });
      }
    });
    revalidateApp();
    revalidatePath("/setup");
    return { ok: true, message: "Top values saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

async function assertGoalCanBeActive(data: { id?: string; status: GoalStatus; successDefinition: string; valueIds: string[] }) {
  if (data.status !== GoalStatus.ACTIVE) return;
  const user = await getDemoUser();
  const week = currentWeekRange(new Date(), user.preferredWeekStartDay);
  const [metrics, currentWeekCommitmentCount] = data.id
    ? await Promise.all([
        prisma.metric.findMany({ where: { goalId: data.id }, select: { type: true } }),
        prisma.weeklyCommitment.count({ where: { goalId: data.id, weekStartDate: { gte: week.start, lt: week.end } } }),
      ])
    : [[], 0];
  assertActivatable({
    status: data.status,
    successDefinition: data.successDefinition,
    connectedValueCount: data.valueIds.length,
    metrics,
    currentWeekCommitmentCount,
  });
}

export async function saveGoal(input: unknown): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    const data = goalSchema.parse(input);
    await assertGoalCanBeActive(data);

    const goalData = {
      userId: user.id,
      title: data.title,
      description: data.description,
      lifeDomainId: data.lifeDomainId,
      goalType: data.goalType,
      status: data.status,
      startDate: data.startDate,
      targetDate: data.targetDate,
      whyNow: data.whyNow,
      successDefinition: data.successDefinition,
      tradeOffs: data.tradeOffs,
      notWorthItIf: data.notWorthItIf,
      externalWorkUrl: data.externalWorkUrl,
    };

    const goal = data.id
      ? await prisma.$transaction(async (tx) => {
          const updated = await tx.goal.update({ where: { id: data.id }, data: goalData });
          await tx.goalNeed.deleteMany({ where: { goalId: updated.id } });
          await tx.goalValue.deleteMany({ where: { goalId: updated.id } });
          await tx.goalCriterion.deleteMany({ where: { goalId: updated.id } });
          const needRows = data.needIds.map((needId) => ({ goalId: updated.id, needId }));
          const valueRows = data.valueIds.map((valueId) => ({ goalId: updated.id, valueId }));
          const criterionRows = data.criteria.filter(Boolean).map((statement) => ({ goalId: updated.id, statement }));
          if (needRows.length) await tx.goalNeed.createMany({ data: needRows });
          if (valueRows.length) await tx.goalValue.createMany({ data: valueRows });
          if (criterionRows.length) await tx.goalCriterion.createMany({ data: criterionRows });
          return updated;
        })
      : await prisma.$transaction(async (tx) => {
          const created = await tx.goal.create({ data: goalData });
          const needRows = data.needIds.map((needId) => ({ goalId: created.id, needId }));
          const valueRows = data.valueIds.map((valueId) => ({ goalId: created.id, valueId }));
          const criterionRows = data.criteria.filter(Boolean).map((statement) => ({ goalId: created.id, statement }));
          if (needRows.length) await tx.goalNeed.createMany({ data: needRows });
          if (valueRows.length) await tx.goalValue.createMany({ data: valueRows });
          if (criterionRows.length) await tx.goalCriterion.createMany({ data: criterionRows });
          return created;
        });

    revalidateApp();
    revalidatePath(`/goals/${goal.id}`);
    return { ok: true, id: goal.id, message: "Goal saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveMetric(input: unknown): Promise<ActionResult> {
  try {
    const data = metricSchema.parse(input);
    const metric = await prisma.metric.create({ data });
    revalidateApp();
    revalidatePath(`/goals/${data.goalId}`);
    return { ok: true, id: metric.id, message: "Metric added." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function addRecommendedMetricStack(goalId: string): Promise<ActionResult> {
  try {
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: goalId }, include: { metrics: true } });
    const template = breakdownTemplates[goal.goalType];
    const existing = new Set(goal.metrics.map((metric) => `${metric.type}:${metric.name.toLowerCase()}`));
    const metricsToCreate = template.metrics.filter((metric) => !existing.has(`${metric.type}:${metric.name.toLowerCase()}`));
    if (!metricsToCreate.length) return { ok: true, message: "Recommended metric stack already exists." };
    await prisma.metric.createMany({
      data: metricsToCreate.map((metric) => ({
        goalId,
        name: metric.name,
        type: metric.type,
        unit: metric.unit,
        direction: metric.direction,
        frequency: metric.frequency,
      })),
    });
    revalidateApp();
    revalidatePath(`/goals/${goalId}`);
    return { ok: true, message: `Added ${metricsToCreate.length} recommended metrics.` };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveMetricEntry(input: unknown): Promise<ActionResult> {
  try {
    const data = metricEntrySchema.parse(input);
    const entry = await prisma.metricEntry.create({
      data: { metricId: data.metricId, value: data.value, entryDate: data.entryDate!, note: data.note },
    });
    await prisma.metric.update({ where: { id: data.metricId }, data: { currentValue: data.value } });
    revalidateApp();
    revalidatePath(`/goals/${data.goalId}`);
    return { ok: true, id: entry.id, message: "Metric entry logged." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveCommitment(input: unknown): Promise<ActionResult> {
  try {
    const data = commitmentSchema.parse(input);
    const commitment = await prisma.weeklyCommitment.create({
      data: {
        goalId: data.goalId,
        weekStartDate: data.weekStartDate!,
        statement: data.statement,
        targetValue: data.targetValue,
        actualValue: data.actualValue,
        unit: data.unit,
        status: data.status,
        notes: data.notes,
      },
    });
    revalidateApp();
    revalidatePath(`/goals/${data.goalId}`);
    return { ok: true, id: commitment.id, message: "Commitment saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function updateCommitmentStatus(input: { id: string; goalId: string; status: string; actualValue?: number | null; notes?: string }): Promise<ActionResult> {
  try {
    await prisma.weeklyCommitment.update({
      where: { id: input.id },
      data: { status: input.status as never, actualValue: input.actualValue ?? undefined, notes: input.notes },
    });
    revalidateApp();
    revalidatePath(`/goals/${input.goalId}`);
    return { ok: true, message: "Commitment updated." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function runGoalBreakdown(input: unknown): Promise<ActionResult> {
  try {
    const data = breakdownAssumptionSchema.parse(input);
    const goal = await prisma.goal.findUniqueOrThrow({ where: { id: data.goalId } });
    const result = runBreakdown(goal.goalType, data.assumptions);
    if (result.missing.length) return { ok: false, message: `Missing: ${result.missing.join(", ")}` };
    await prisma.$transaction(async (tx) => {
      await tx.breakdownAssumption.deleteMany({ where: { goalId: goal.id } });
      await tx.breakdownOutput.deleteMany({ where: { goalId: goal.id } });
      const template = Object.entries(data.assumptions).filter(([, value]) => value);
      await tx.breakdownAssumption.createMany({
        data: template.map(([key, value]) => ({ goalId: goal.id, key, label: key, value: value ?? "" })),
      });
      await tx.breakdownOutput.createMany({
        data: [
          ...result.outputs.map((output) => ({ goalId: goal.id, ...output })),
          ...(result.suggestedCommitment
            ? [{ goalId: goal.id, label: "Suggested weekly commitment", value: result.suggestedCommitment }]
            : []),
        ],
      });
    });
    revalidateApp();
    revalidatePath(`/goals/${goal.id}`);
    return { ok: true, message: "Breakdown updated." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveReview(input: unknown): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    const data = reviewSchema.parse(input);
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId: user.id,
          reviewType: "WEEKLY",
          periodStart: data.periodStart!,
          periodEnd: data.periodEnd!,
          wins: data.wins,
          misses: data.misses,
          blockers: data.blockers,
          lessons: data.lessons,
          domainDamage: data.domainDamage,
          continueAdjustPauseKill: data.continueAdjustPauseKill,
          goalReviews: {
            create: data.goalReviews.map((goalReview) => ({
              goalId: goalReview.goalId,
              progressSummary: goalReview.progressSummary,
              alignmentScore: goalReview.alignmentScore,
              costScore: goalReview.costScore,
              confidenceScore: goalReview.confidenceScore,
              decision: goalReview.decision,
              decisionReason: goalReview.decisionReason,
              stillWantThis: goalReview.stillWantThis,
              realityVsFantasy: goalReview.realityVsFantasy,
              valuesConnection: goalReview.valuesConnection,
              costAcceptable: goalReview.costAcceptable,
              domainDamage: goalReview.domainDamage,
            })),
          },
        },
      });

      for (const goalReview of data.goalReviews) {
        if (!goalReview.updateStatus) continue;
        const status = statusForReviewDecision(goalReview.decision, goalReview.updateStatus);
        if (status) await tx.goal.update({ where: { id: goalReview.goalId }, data: { status } });
      }
      return created;
    });
    revalidateApp();
    return { ok: true, id: review.id, message: "Review saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function updateSettings(input: unknown): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    const data = settingsSchema.parse(input);
    await prisma.user.update({
      where: { id: user.id },
      data: { name: data.name, email: data.email || null, preferredWeekStartDay: data.preferredWeekStartDay, currency: data.currency },
    });
    revalidateApp();
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function completeSetup(): Promise<ActionResult> {
  try {
    const user = await getDemoUser();
    await prisma.user.update({ where: { id: user.id }, data: { setupCompletedAt: new Date() } });
    revalidateApp();
    return { ok: true, message: "Setup completed." };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function goToGoal(id: string) {
  redirect(`/goals/${id}`);
}
