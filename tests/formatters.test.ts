import test from "node:test";
import assert from "node:assert/strict";
import { formatMetricValue } from "../lib/formatters";

test("currency unit displays configured symbol instead of literal currency", () => {
  assert.equal(formatMetricValue("25000", "currency", "€"), "€25,000");
  assert.equal(formatMetricValue("25000", "currency", "USD"), "USD 25,000");
});
