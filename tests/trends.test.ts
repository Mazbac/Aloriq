import test from "node:test";
import assert from "node:assert/strict";
import { MetricDirection } from "@prisma/client";
import { interpretMetricTrend } from "../lib/goals/trends";

test("increase metrics improve when higher", () => {
  assert.equal(interpretMetricTrend({ direction: MetricDirection.INCREASE, latest: 10, previous: 7 }), "Improving");
});

test("decrease metrics improve when lower", () => {
  assert.equal(interpretMetricTrend({ direction: MetricDirection.DECREASE, latest: 3, previous: 6 }), "Improving");
});

test("maintain metrics improve when closer to target", () => {
  assert.equal(interpretMetricTrend({ direction: MetricDirection.MAINTAIN, latest: 98, previous: 94, target: 100 }), "Improving");
});

test("score metrics compare against target when present", () => {
  assert.equal(interpretMetricTrend({ direction: MetricDirection.SCORE, latest: 8, previous: 6, target: 9 }), "Improving");
});

test("boolean metrics show completion state", () => {
  assert.equal(interpretMetricTrend({ direction: MetricDirection.BOOLEAN, latest: 1, previous: 0 }), "Completed");
  assert.equal(interpretMetricTrend({ direction: MetricDirection.BOOLEAN, latest: 0, previous: 1 }), "Not completed");
});
