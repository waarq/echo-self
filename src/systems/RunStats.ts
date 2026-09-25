/** Per-run summary counters shown on the RESULTS screen (PRD §27's "RUN
 * RECORDED" summary: survival time, echoes created, perfect dodges, max
 * Flow). Distinct from ScoreSystem, which tracks the score value itself —
 * this is display-only bookkeeping for the death/results screen. */
export class RunStats {
  survivalTimeSec = 0;
  echoesCreated = 0;
  perfectDodges = 0;
  maxFlowMultiplier = 1;

  reset(): void {
    this.survivalTimeSec = 0;
    this.echoesCreated = 0;
    this.perfectDodges = 0;
    this.maxFlowMultiplier = 1;
  }

  update(dt: number): void {
    this.survivalTimeSec += dt;
  }

  onEchoCreated(): void {
    this.echoesCreated += 1;
  }

  onPerfectDodges(count: number): void {
    this.perfectDodges += count;
  }

  trackFlowMultiplier(multiplier: number): void {
    this.maxFlowMultiplier = Math.max(this.maxFlowMultiplier, multiplier);
  }
}
