import test from "node:test";
import assert from "node:assert/strict";
import { GoalStatus, ReviewDecision } from "@prisma/client";
import { statusForReviewDecision } from "../lib/reviews/decisions";

test("review decisions update status only when confirmed", () => {
  assert.equal(statusForReviewDecision(ReviewDecision.PAUSE, false), null);
  assert.equal(statusForReviewDecision(ReviewDecision.PAUSE, true), GoalStatus.PAUSED);
  assert.equal(statusForReviewDecision(ReviewDecision.KILL, true), GoalStatus.KILLED);
  assert.equal(statusForReviewDecision(ReviewDecision.COMPLETE, true), GoalStatus.COMPLETED);
  assert.equal(statusForReviewDecision(ReviewDecision.ADJUST, true), null);
  assert.equal(statusForReviewDecision(ReviewDecision.CONTINUE, true), null);
});
