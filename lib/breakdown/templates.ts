import { GoalType } from "@prisma/client";
import type { BreakdownTemplate } from "./types";

export const breakdownTemplates: Record<GoalType, BreakdownTemplate> = {
  BUSINESS_REVENUE: {
    type: "BUSINESS_REVENUE",
    assumptions: [
      { key: "targetArr", label: "Target ARR", unit: "USD", required: true },
      { key: "currentArr", label: "Current ARR", unit: "USD", required: true },
      { key: "targetDate", label: "Target date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "arpa", label: "Average revenue per customer per month", unit: "USD", required: true },
      { key: "trialConversion", label: "Trial-to-customer conversion rate", placeholder: "0.25" },
      { key: "leadConversion", label: "Lead-to-trial conversion rate", placeholder: "0.2" },
      { key: "workingDaysPerWeek", label: "Working days per week", unit: "days", required: true },
    ],
    metrics: [
      { name: "ARR or MRR", type: "OUTCOME", unit: "USD", direction: "INCREASE", frequency: "MONTHLY" },
      { name: "Qualified leads", type: "LEAD", unit: "leads", direction: "INCREASE", frequency: "WEEKLY" },
      { name: "Trials or demos", type: "LEAD", unit: "trials", direction: "INCREASE", frequency: "WEEKLY" },
      { name: "Churn or burnout", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
      { name: "Still worth pursuing", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    ],
  },
  PERSONAL_FINANCE: {
    type: "PERSONAL_FINANCE",
    assumptions: [
      { key: "targetSavings", label: "Target savings", unit: "USD", required: true },
      { key: "currentSavings", label: "Current savings", unit: "USD", required: true },
      { key: "targetDate", label: "Target date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "monthlyIncome", label: "Monthly income", unit: "USD" },
      { key: "monthlyExpenses", label: "Monthly expenses", unit: "USD" },
    ],
    metrics: [
      { name: "Savings balance", type: "OUTCOME", unit: "USD", direction: "INCREASE", frequency: "MONTHLY" },
      { name: "Savings contribution", type: "LEAD", unit: "USD", direction: "INCREASE", frequency: "MONTHLY" },
      { name: "Stress", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
      { name: "Security or freedom", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    ],
  },
  HEALTH_BODY: {
    type: "HEALTH_BODY",
    assumptions: [
      { key: "currentValue", label: "Current value", required: true },
      { key: "targetValue", label: "Target value", required: true },
      { key: "targetDate", label: "Target date", required: true, placeholder: "YYYY-MM-DD" },
      { key: "unit", label: "Unit", required: true },
      { key: "externalTrackerUrl", label: "External tracker URL" },
      { key: "preferredLeadBehavior", label: "Preferred lead behavior", required: true },
      { key: "weeklyFrequencyTarget", label: "Weekly frequency target", required: true },
    ],
    metrics: [
      { name: "Outcome marker", type: "OUTCOME", direction: "MAINTAIN", frequency: "MONTHLY" },
      { name: "Lead behavior", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
      { name: "Sleep, fatigue, injury, obsession", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
      { name: "Vitality", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    ],
  },
  RELATIONSHIP: {
    type: "RELATIONSHIP",
    assumptions: [
      { key: "currentSatisfaction", label: "Current satisfaction score", required: true },
      { key: "desiredSatisfaction", label: "Desired satisfaction score", required: true },
      { key: "mainFrictionPoint", label: "Main friction point", required: true },
      { key: "desiredWeeklyRitual", label: "Desired weekly ritual", required: true },
      { key: "checkInFrequency", label: "Check-in frequency", required: true },
    ],
    metrics: [
      { name: "Relationship satisfaction", type: "OUTCOME", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
      { name: "Intentional quality time", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
      { name: "Unresolved conflict", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
      { name: "Connection", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    ],
  },
  SKILL_LEARNING: {
    type: "SKILL_LEARNING",
    assumptions: [
      { key: "targetSkill", label: "Target skill", required: true },
      { key: "currentLevel", label: "Current level", required: true },
      { key: "targetLevel", label: "Target level", required: true },
      { key: "deadline", label: "Deadline", required: true, placeholder: "YYYY-MM-DD" },
      { key: "weeklyPracticeHours", label: "Weekly practice hours available", required: true },
      { key: "assessmentMethod", label: "Assessment method", required: true },
    ],
    metrics: [
      { name: "Assessment score or project", type: "OUTCOME", direction: "INCREASE", frequency: "MONTHLY" },
      { name: "Deliberate practice", type: "LEAD", unit: "hours", direction: "INCREASE", frequency: "WEEKLY" },
      { name: "Burnout or avoidance", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
      { name: "Mastery", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    ],
  },
  CAREER: { type: "CAREER", assumptions: [], metrics: [
    { name: "Role, income, promotion, offers, interviews", type: "OUTCOME", direction: "INCREASE", frequency: "MONTHLY" },
    { name: "Applications, conversations, portfolio work", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
    { name: "Stress or misalignment", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
    { name: "Autonomy and competence", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
  ] },
  MENTAL_EMOTIONAL: { type: "MENTAL_EMOTIONAL", assumptions: [], metrics: [
    { name: "Mood, stress, anxiety, regulation", type: "OUTCOME", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    { name: "Support practice", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
    { name: "Worsening symptoms", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
    { name: "Peace", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
  ] },
  MEANING_SPIRITUALITY: { type: "MEANING_SPIRITUALITY", assumptions: [], metrics: [
    { name: "Meaning", type: "OUTCOME", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
    { name: "Practice, service, reflection, community", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
    { name: "Isolation or avoidance", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
    { name: "Coherence", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
  ] },
  LIFESTYLE_ENVIRONMENT: { type: "LIFESTYLE_ENVIRONMENT", assumptions: [], metrics: [
    { name: "Environment satisfaction", type: "OUTCOME", unit: "score", direction: "SCORE", frequency: "MONTHLY" },
    { name: "Environment improvement steps", type: "LEAD", direction: "INCREASE", frequency: "WEEKLY" },
    { name: "Overspending or stress", type: "RISK", unit: "score", direction: "DECREASE", frequency: "WEEKLY" },
    { name: "Peace or freedom", type: "ALIGNMENT", unit: "score", direction: "SCORE", frequency: "WEEKLY" },
  ] },
  CUSTOM: { type: "CUSTOM", assumptions: [], metrics: [] },
};
