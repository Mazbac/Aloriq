import test from "node:test";
import assert from "node:assert/strict";
import { GoalType } from "@prisma/client";
import { runBreakdown } from "../lib/breakdown";

test("business revenue breakdown accepts percentage conversion inputs", () => {
  const result = runBreakdown(GoalType.BUSINESS_REVENUE, {
    targetArr: "300000",
    currentArr: "150000",
    targetDate: "2026-12-31",
    arpa: "2500",
    trialConversion: "25%",
    leadConversion: "20%",
    workingDaysPerWeek: "5",
  });

  assert.deepEqual(result.missing, []);
  assert.equal(result.outputs.find((output) => output.label === "Target MRR")?.value, "25000");
  assert.ok(result.outputs.some((output) => output.label === "Required qualified leads" && output.period === "week"));
  assert.match(result.suggestedCommitment ?? "", /qualified leads/);
});

test("personal finance breakdown reports missing required assumptions", () => {
  const result = runBreakdown(GoalType.PERSONAL_FINANCE, {
    targetSavings: "20000",
  });

  assert.deepEqual(result.missing, ["Current savings", "Target date"]);
  assert.equal(result.outputs.length, 0);
});
