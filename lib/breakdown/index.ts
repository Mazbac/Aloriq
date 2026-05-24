import { GoalType } from "@prisma/client";
import { breakdownTemplates } from "./templates";
import type { AssumptionInput, BreakdownOutputItem, BreakdownResult } from "./types";

function num(input: string | undefined) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(value: number, digits = 1) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function monthsUntil(dateText?: string) {
  if (!dateText) return null;
  const target = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const days = Math.max(1, (target.getTime() - now.getTime()) / 86_400_000);
  return Math.max(days / 30.44, 0.25);
}

function weeksUntil(dateText?: string) {
  if (!dateText) return null;
  const target = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const days = Math.max(1, (target.getTime() - now.getTime()) / 86_400_000);
  return Math.max(days / 7, 0.25);
}

function missingFor(type: GoalType, assumptions: AssumptionInput) {
  return breakdownTemplates[type].assumptions.filter((item) => item.required && !assumptions[item.key]).map((item) => item.label);
}

export function runBreakdown(type: GoalType, assumptions: AssumptionInput): BreakdownResult {
  const template = breakdownTemplates[type];
  const missing = missingFor(type, assumptions);
  if (missing.length) return { missing, outputs: [], suggestedMetrics: template.metrics };

  let outputs: BreakdownOutputItem[] = [];
  let suggestedCommitment: string | undefined;

  if (type === "BUSINESS_REVENUE") {
    const targetArr = num(assumptions.targetArr) ?? 0;
    const currentArr = num(assumptions.currentArr) ?? 0;
    const arpa = Math.max(num(assumptions.arpa) ?? 1, 1);
    const workingDaysPerWeek = Math.max(num(assumptions.workingDaysPerWeek) ?? 5, 1);
    const months = monthsUntil(assumptions.targetDate) ?? 1;
    const targetMrr = targetArr / 12;
    const currentMrr = currentArr / 12;
    const customerGap = Math.max(0, targetMrr / arpa - currentMrr / arpa);
    const newCustomersPerMonth = customerGap / months;
    const newCustomersPerWeek = newCustomersPerMonth / 4.33;
    outputs = [
      { label: "Target MRR", value: fmt(targetMrr, 0), unit: "USD" },
      { label: "Required active customers", value: fmt(targetMrr / arpa, 1), unit: "customers" },
      { label: "Customer gap", value: fmt(customerGap, 1), unit: "customers" },
      { label: "Net new customers", value: fmt(newCustomersPerMonth, 1), unit: "customers", period: "month" },
      { label: "Net new customers", value: fmt(newCustomersPerWeek, 1), unit: "customers", period: "week" },
    ];
    const trialConversion = num(assumptions.trialConversion);
    const leadConversion = num(assumptions.leadConversion);
    if (trialConversion && trialConversion > 0) {
      const trialsPerWeek = newCustomersPerMonth / trialConversion / 4.33;
      outputs.push({ label: "Required trials or demos", value: fmt(trialsPerWeek, 1), unit: "trials", period: "week" });
      suggestedCommitment = `Create ${Math.ceil(trialsPerWeek)} trials or demos this week`;
      if (leadConversion && leadConversion > 0) {
        const leadsPerWeek = newCustomersPerMonth / trialConversion / leadConversion / 4.33;
        outputs.push({ label: "Required qualified leads", value: fmt(leadsPerWeek, 1), unit: "leads", period: "week" });
        outputs.push({ label: "Required qualified leads", value: fmt(leadsPerWeek / workingDaysPerWeek, 1), unit: "leads", period: "working day" });
        suggestedCommitment = `Generate ${Math.ceil(leadsPerWeek)} qualified leads this week`;
      }
    }
    suggestedCommitment ??= `Close ${Math.ceil(newCustomersPerMonth)} net new customers this month`;
  }

  if (type === "PERSONAL_FINANCE") {
    const targetSavings = num(assumptions.targetSavings) ?? 0;
    const currentSavings = num(assumptions.currentSavings) ?? 0;
    const gap = Math.max(0, targetSavings - currentSavings);
    const months = monthsUntil(assumptions.targetDate) ?? 1;
    const requiredMonthly = gap / months;
    const income = num(assumptions.monthlyIncome);
    const expenses = num(assumptions.monthlyExpenses);
    outputs = [
      { label: "Savings gap", value: fmt(gap, 0), unit: "USD" },
      { label: "Required savings", value: fmt(requiredMonthly, 0), unit: "USD", period: "month" },
      { label: "Required savings", value: fmt(requiredMonthly / 4.33, 0), unit: "USD", period: "week" },
    ];
    if (income != null && expenses != null) {
      const capacity = income - expenses;
      outputs.push({ label: "Estimated current capacity", value: fmt(capacity, 0), unit: "USD", period: "month" });
      if (requiredMonthly > capacity) outputs.push({ label: "Capacity warning", value: fmt(requiredMonthly - capacity, 0), unit: "USD", explanation: "Required monthly savings exceeds estimated capacity." });
    }
    suggestedCommitment = `Transfer ${Math.ceil(requiredMonthly / 4.33)} to savings`;
  }

  if (type === "HEALTH_BODY") {
    const current = num(assumptions.currentValue) ?? 0;
    const target = num(assumptions.targetValue) ?? 0;
    const gap = target - current;
    const weeks = weeksUntil(assumptions.targetDate) ?? 1;
    outputs = [
      { label: "Total gap", value: fmt(gap, 1), unit: assumptions.unit },
      { label: "Required weekly pace", value: fmt(gap / weeks, 2), unit: assumptions.unit, period: "week" },
      { label: "Suggested lead behavior", value: assumptions.preferredLeadBehavior ?? "", period: `${assumptions.weeklyFrequencyTarget}x per week` },
      { label: "Risk reminders", value: "Track sleep, energy, injury, and obsession risk.", explanation: "Use a specialist tracker for calories, macros, workouts, or medical detail." },
    ];
    suggestedCommitment = `${assumptions.preferredLeadBehavior} ${assumptions.weeklyFrequencyTarget} times this week`;
  }

  if (type === "RELATIONSHIP") {
    const current = num(assumptions.currentSatisfaction) ?? 0;
    const desired = num(assumptions.desiredSatisfaction) ?? 0;
    outputs = [
      { label: "Satisfaction gap", value: fmt(desired - current, 0), unit: "score" },
      { label: "Weekly quality time commitment", value: assumptions.desiredWeeklyRitual ?? "" },
      { label: "Check-in conversation commitment", value: assumptions.checkInFrequency ?? "" },
      { label: "Risk metric", value: "Unresolved conflict or resentment score" },
      { label: "Alignment metric", value: "Connection score" },
    ];
    suggestedCommitment = assumptions.desiredWeeklyRitual || "Have one relationship check-in";
  }

  if (type === "SKILL_LEARNING") {
    const weeks = weeksUntil(assumptions.deadline) ?? 1;
    outputs = [
      { label: "Weeks remaining", value: fmt(weeks, 1), unit: "weeks" },
      { label: "Weekly practice hours", value: assumptions.weeklyPracticeHours ?? "", unit: "hours" },
      { label: "Feedback frequency", value: "At least once this week when possible" },
      { label: "Project or assessment milestone", value: assumptions.assessmentMethod ?? "" },
    ];
    suggestedCommitment = `Practice ${assumptions.weeklyPracticeHours} hours this week`;
  }

  return { missing: [], outputs, suggestedCommitment, suggestedMetrics: template.metrics };
}
