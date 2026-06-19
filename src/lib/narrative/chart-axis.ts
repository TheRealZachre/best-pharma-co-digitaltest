/** Round up to a readable Y-axis max for engagement rate (%). */
export function engagementRateAxisMax(values: number[]): number {
  const peak = Math.max(...values, 0);
  if (peak <= 0) return 1;
  if (peak <= 1) return 1;
  if (peak <= 2) return 2;
  if (peak <= 5) return 5;
  if (peak <= 10) return 10;
  return Math.ceil(peak / 5) * 5;
}

export function engagementRateAxisTicks(max: number): number[] {
  if (max <= 1) return [0, 0.25, 0.5, 0.75, 1];
  if (max <= 2) return [0, 0.5, 1, 1.5, 2];
  const step = max <= 5 ? 1 : max / 5;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 0.001; v += step) {
    ticks.push(Math.round(v * 10) / 10);
  }
  return ticks;
}
