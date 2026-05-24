import test from "node:test";
import assert from "node:assert/strict";
import { GoalStatus, MetricType } from "@prisma/client";
import { activationErrors, assertActivatable } from "../lib/goals/activation";

const completeMetrics = [
  { type: MetricType.OUTCOME },
  { type: MetricType.LEAD },
  { type: MetricType.RISK },
  { type: MetricType.ALIGNMENT },
];

test("draft goals do not require activation fields", () => {
  assert.doesNotThrow(() =>
    assertActivatable({
      status: GoalStatus.DRAFT,
      successDefinition: "",
      connectedValueCount: 0,
      metrics: [],
      currentWeekCommitmentCount: 0,
    }),
  );
});

test("active goals require definition, values, complete metrics, and current-week commitment", () => {
  const errors = activationErrors({
    status: GoalStatus.ACTIVE,
    successDefinition: "",
    connectedValueCount: 0,
    metrics: [{ type: MetricType.OUTCOME }],
    currentWeekCommitmentCount: 0,
  });

  assert.ok(errors.some((error) => error.includes("Success definition")));
  assert.ok(errors.some((error) => error.includes("value")));
  assert.ok(errors.some((error) => error.includes("metric stack")));
  assert.ok(errors.some((error) => error.includes("current-week commitment")));
});

test("complete active goals pass activation validation", () => {
  assert.doesNotThrow(() =>
    assertActivatable({
      status: GoalStatus.ACTIVE,
      successDefinition: "Success is observable.",
      connectedValueCount: 1,
      metrics: completeMetrics,
      currentWeekCommitmentCount: 1,
    }),
  );
});
