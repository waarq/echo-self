/** Fixed simulation timestep. Rendering may run at variable FPS, but all
 * gameplay logic advances in fixed 1/60s steps so Echo playback stays
 * deterministic. */
export const FIXED_DT = 1 / 60;
export const MAX_FRAME_TIME = 0.25;

/**
 * Given elapsed frame time and a leftover accumulator, returns how many fixed
 * steps to run and the new accumulator remainder. Pulled out as a pure
 * function so the stepping math is unit-testable without a real clock.
 */
export function accumulateSteps(
  frameTime: number,
  accumulator: number,
  fixedDt: number = FIXED_DT,
  maxFrameTime: number = MAX_FRAME_TIME,
): { steps: number; accumulator: number } {
  const clamped = Math.min(frameTime, maxFrameTime);
  let acc = accumulator + clamped;
  let steps = 0;
  while (acc >= fixedDt) {
    acc -= fixedDt;
    steps += 1;
  }
  return { steps, accumulator: acc };
}
