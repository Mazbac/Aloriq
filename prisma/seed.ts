import { PrismaClient, GoalStatus, GoalType, MetricDirection, MetricFrequency, MetricType, CommitmentStatus, ReviewDecision } from "@prisma/client";
import { defaultLifeDomains, defaultNeeds, suggestedValues } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@aloriq.local",
      preferredWeekStartDay: 1,
      currency: "USD",
    },
  });

  const domains = await Promise.all(
    defaultLifeDomains.map(([name, description, satisfactionScore, importanceScore, riskScore]) =>
      prisma.lifeDomain.create({
        data: {
          userId: user.id,
          name,
          description,
          satisfactionScore,
          importanceScore,
          riskScore,
          notes:
            riskScore >= 7
              ? "Worth reviewing before adding another major commitment."
              : "Current snapshot from demo seed data.",
        },
      }),
    ),
  );

  const needs = await Promise.all(
    defaultNeeds.map(([name, description]) =>
      prisma.need.create({ data: { userId: user.id, name, description } }),
    ),
  );

  const values = await Promise.all(
    suggestedValues.map((name, index) =>
      prisma.value.create({
        data: {
          userId: user.id,
          name,
          description: index < 5 ? `Demo description for ${name.toLowerCase()}.` : null,
          rank: index < 5 ? index + 1 : null,
          criteria:
            index < 3
              ? {
                  create: [
                    {
                      statement:
                        name === "Freedom"
                          ? "I control the most important blocks on my calendar."
                          : name === "Peace"
                            ? "My pace does not depend on constant urgency."
                            : "My commitments visibly express this value.",
                      isHealthy: true,
                    },
                  ],
                }
              : undefined,
        },
      }),
    ),
  );

  const workDomain = domains.find((domain) => domain.name.startsWith("Work"))!;
  const healthDomain = domains.find((domain) => domain.name === "Physical Health")!;
  const autonomy = needs.find((need) => need.name === "Autonomy")!;
  const competence = needs.find((need) => need.name === "Competence")!;
  const vitality = needs.find((need) => need.name === "Vitality")!;
  const freedom = values.find((value) => value.name === "Freedom")!;
  const mastery = values.find((value) => value.name === "Mastery")!;
  const health = values.find((value) => value.name === "Health")!;

  const revenueGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Reach 300k ARR without adding chaos",
      description: "Grow the business while keeping delivery quality and recovery protected.",
      lifeDomainId: workDomain.id,
      goalType: GoalType.BUSINESS_REVENUE,
      status: GoalStatus.ACTIVE,
      startDate: new Date("2026-05-01"),
      targetDate: new Date("2026-12-31"),
      whyNow: "The current offer is validated and the pipeline needs a clearer operating target.",
      successDefinition: "300k ARR with stable fulfillment and no sustained damage to health or relationships.",
      tradeOffs: "Fewer side projects and tighter qualification standards.",
      notWorthItIf: "Sleep, trust, or delivery quality degrade for more than two review cycles.",
      externalWorkUrl: "https://github.com/",
      needs: { create: [{ needId: autonomy.id }, { needId: competence.id }] },
      values: { create: [{ valueId: freedom.id }, { valueId: mastery.id }] },
      criteria: {
        create: [
          { statement: "The business can grow without calendar sprawl." },
          { statement: "Revenue quality matters more than vanity pipeline volume." },
        ],
      },
      metrics: {
        create: [
          { name: "ARR", type: MetricType.OUTCOME, unit: "currency", targetValue: 300000, currentValue: 150000, direction: MetricDirection.INCREASE, frequency: MetricFrequency.MONTHLY },
          { name: "Qualified leads", type: MetricType.LEAD, unit: "leads", targetValue: 25, currentValue: 12, direction: MetricDirection.INCREASE, frequency: MetricFrequency.WEEKLY },
          { name: "Burnout risk", type: MetricType.RISK, unit: "score", targetValue: 4, currentValue: 5, direction: MetricDirection.DECREASE, frequency: MetricFrequency.WEEKLY },
          { name: "Still worth pursuing", type: MetricType.ALIGNMENT, unit: "score", targetValue: 8, currentValue: 8, direction: MetricDirection.SCORE, frequency: MetricFrequency.WEEKLY },
        ],
      },
      weeklyCommitments: {
        create: [
          { weekStartDate: new Date("2026-05-18"), statement: "Generate 25 qualified leads this week", targetValue: 25, actualValue: 18, unit: "leads", status: CommitmentStatus.PARTIAL },
        ],
      },
      breakdownAssumptions: {
        create: [
          { key: "targetArr", label: "Target ARR", value: "300000", unit: "currency" },
          { key: "currentArr", label: "Current ARR", value: "150000", unit: "currency" },
          { key: "arpa", label: "Average revenue per customer per month", value: "2500", unit: "currency" },
          { key: "trialConversion", label: "Trial-to-customer conversion rate", value: "0.25" },
          { key: "leadConversion", label: "Lead-to-trial conversion rate", value: "0.2" },
          { key: "workingDaysPerWeek", label: "Working days per week", value: "5", unit: "days" },
        ],
      },
    },
  });

  const healthGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Rebuild baseline strength and energy",
      description: "Use a light health goal that supports vitality without turning this app into a tracker.",
      lifeDomainId: healthDomain.id,
      goalType: GoalType.HEALTH_BODY,
      status: GoalStatus.ACTIVE,
      startDate: new Date("2026-05-06"),
      targetDate: new Date("2026-09-30"),
      whyNow: "Energy has become the constraint on work quality and recovery.",
      successDefinition: "Train consistently, improve strength markers, and keep sleep/energy stable.",
      tradeOffs: "Less late-night work and fewer low-value evening plans.",
      notWorthItIf: "The plan produces injury, obsession, or lower energy for multiple weeks.",
      externalWorkUrl: "https://www.macrofactorapp.com/",
      needs: { create: [{ needId: vitality.id }, { needId: competence.id }] },
      values: { create: [{ valueId: health.id }, { valueId: mastery.id }] },
      criteria: { create: [{ statement: "Training improves the rest of life instead of consuming it." }] },
      metrics: {
        create: [
          { name: "Strength baseline", type: MetricType.OUTCOME, unit: "score", targetValue: 8, currentValue: 5, direction: MetricDirection.SCORE, frequency: MetricFrequency.MONTHLY },
          { name: "Workouts completed", type: MetricType.LEAD, unit: "sessions", targetValue: 4, currentValue: 3, direction: MetricDirection.INCREASE, frequency: MetricFrequency.WEEKLY },
          { name: "Fatigue", type: MetricType.RISK, unit: "score", targetValue: 4, currentValue: 4, direction: MetricDirection.DECREASE, frequency: MetricFrequency.WEEKLY },
          { name: "Vitality", type: MetricType.ALIGNMENT, unit: "score", targetValue: 8, currentValue: 7, direction: MetricDirection.SCORE, frequency: MetricFrequency.WEEKLY },
        ],
      },
      weeklyCommitments: {
        create: [
          { weekStartDate: new Date("2026-05-18"), statement: "Complete 4 workouts", targetValue: 4, actualValue: 3, unit: "sessions", status: CommitmentStatus.PARTIAL },
        ],
      },
    },
  });

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      reviewType: "WEEKLY",
      periodStart: new Date("2026-05-11"),
      periodEnd: new Date("2026-05-17"),
      wins: "Lead quality improved and workouts happened despite travel.",
      misses: "Recovery blocks were too easy to trade away.",
      blockers: "Calendar defaults still favor reactive work.",
      lessons: "Commitments need to be smaller but protected earlier in the week.",
      domainDamage: "Play and recovery is the main watch item.",
      continueAdjustPauseKill: "Continue both goals, adjust the weekly lead target.",
      goalReviews: {
        create: [
          {
            goalId: revenueGoal.id,
            progressSummary: "Pipeline moved, but lead quality needs tighter qualification.",
            alignmentScore: 8,
            costScore: 6,
            confidenceScore: 7,
            decision: ReviewDecision.ADJUST,
            decisionReason: "Keep the goal, reduce noisy lead sources.",
          },
          {
            goalId: healthGoal.id,
            progressSummary: "Consistency improved and fatigue stayed manageable.",
            alignmentScore: 9,
            costScore: 3,
            confidenceScore: 8,
            decision: ReviewDecision.CONTINUE,
            decisionReason: "The plan supports energy without dominating the week.",
          },
        ],
      },
    },
  });

  await prisma.metricEntry.createMany({
    data: [
      { metricId: (await prisma.metric.findFirstOrThrow({ where: { goalId: revenueGoal.id, name: "ARR" } })).id, value: 150000, entryDate: new Date("2026-05-17"), note: "Seed snapshot" },
      { metricId: (await prisma.metric.findFirstOrThrow({ where: { goalId: healthGoal.id, name: "Workouts completed" } })).id, value: 3, entryDate: new Date("2026-05-17"), note: "Travel week" },
    ],
  });

  console.log(`Seeded Aloriq demo data for ${user.name}; previous review ${review.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
