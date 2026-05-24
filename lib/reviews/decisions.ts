import { GoalStatus, ReviewDecision } from "@prisma/client";

export const statusByReviewDecision: Partial<Record<ReviewDecision, GoalStatus>> = {
  PAUSE: GoalStatus.PAUSED,
  KILL: GoalStatus.KILLED,
  COMPLETE: GoalStatus.COMPLETED,
};

export function statusForReviewDecision(decision: ReviewDecision, updateStatus: boolean) {
  if (!updateStatus) return null;
  return statusByReviewDecision[decision] ?? null;
}
