import test from "node:test";
import assert from "node:assert/strict";
import { metricEntrySchema } from "../lib/validations/schemas";

test("metric entry value rejects empty string instead of coercing to zero", () => {
  const result = metricEntrySchema.safeParse({
    metricId: "metric_1",
    goalId: "goal_1",
    value: "",
    entryDate: "2026-05-24",
    note: "",
  });

  assert.equal(result.success, false);
});

test("metric entry value allows explicit zero", () => {
  const result = metricEntrySchema.safeParse({
    metricId: "metric_1",
    goalId: "goal_1",
    value: "0",
    entryDate: "2026-05-24",
    note: "",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.value, 0);
});

test("metric entry value parses entered numbers", () => {
  const result = metricEntrySchema.safeParse({
    metricId: "metric_1",
    goalId: "goal_1",
    value: "5",
    entryDate: "2026-05-24",
    note: "",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.value, 5);
});
