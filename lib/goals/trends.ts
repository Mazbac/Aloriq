import { MetricDirection } from "@prisma/client";

type TrendInput = {
  direction: MetricDirection;
  latest: number | null;
  previous?: number | null;
  target?: number | null;
};

export function interpretMetricTrend({ direction, latest, previous, target }: TrendInput) {
  if (latest == null) return "No value";
  if (direction === MetricDirection.BOOLEAN) return latest > 0 ? "Completed" : "Not completed";
  if (previous == null) return "Insufficient data";

  if (direction === MetricDirection.INCREASE) {
    if (latest > previous) return "Improving";
    if (latest < previous) return "Worse";
    return "Stable";
  }

  if (direction === MetricDirection.DECREASE) {
    if (latest < previous) return "Improving";
    if (latest > previous) return "Worse";
    return "Stable";
  }

  if (direction === MetricDirection.MAINTAIN && target != null) {
    const latestDistance = Math.abs(latest - target);
    const previousDistance = Math.abs(previous - target);
    if (latestDistance < previousDistance) return "Improving";
    if (latestDistance > previousDistance) return "Worse";
    return "Stable";
  }

  if (direction === MetricDirection.SCORE) {
    if (target != null) {
      const latestDistance = Math.abs(latest - target);
      const previousDistance = Math.abs(previous - target);
      if (latestDistance < previousDistance) return "Improving";
      if (latestDistance > previousDistance) return "Worse";
      return "Stable";
    }
    if (latest === previous) return "Stable";
    return latest > previous ? "Up" : "Down";
  }

  if (latest === previous) return "Stable";
  return target == null ? "Changed" : Math.abs(latest - target) < Math.abs(previous - target) ? "Improving" : "Worse";
}
