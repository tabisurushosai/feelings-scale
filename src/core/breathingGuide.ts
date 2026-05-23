export type BreathingGuidePhase = "inhale" | "exhale";

export interface BreathingGuideViewModel {
  phase: BreathingGuidePhase;
  cycleNumber: number;
  totalCycles: number;
  secondsRemainingInPhase: number;
  progressPercent: number;
  isComplete: boolean;
}

export interface BreathingGuideOptions {
  totalCycles?: number;
  phaseSeconds?: number;
}

export const defaultBreathingGuideCycles = 3;
export const defaultBreathingGuidePhaseSeconds = 4;

export function getBreathingGuideDurationMs(
  options: BreathingGuideOptions = {},
): number {
  const totalCycles = normalizePositiveInteger(options.totalCycles, defaultBreathingGuideCycles);
  const phaseSeconds = normalizePositiveInteger(options.phaseSeconds, defaultBreathingGuidePhaseSeconds);
  return totalCycles * 2 * phaseSeconds * 1000;
}

export function createBreathingGuideViewModel(
  startedAtMs: number,
  currentAtMs: number,
  options: BreathingGuideOptions = {},
): BreathingGuideViewModel {
  const totalCycles = normalizePositiveInteger(options.totalCycles, defaultBreathingGuideCycles);
  const phaseSeconds = normalizePositiveInteger(options.phaseSeconds, defaultBreathingGuidePhaseSeconds);
  const totalSeconds = totalCycles * 2 * phaseSeconds;
  const elapsedSeconds = Math.max(0, Math.floor((currentAtMs - startedAtMs) / 1000));

  if (elapsedSeconds >= totalSeconds) {
    return {
      phase: "exhale",
      cycleNumber: totalCycles,
      totalCycles,
      secondsRemainingInPhase: 0,
      progressPercent: 100,
      isComplete: true,
    };
  }

  const phaseIndex = Math.floor(elapsedSeconds / phaseSeconds);
  const phaseElapsedSeconds = elapsedSeconds % phaseSeconds;

  return {
    phase: phaseIndex % 2 === 0 ? "inhale" : "exhale",
    cycleNumber: Math.floor(phaseIndex / 2) + 1,
    totalCycles,
    secondsRemainingInPhase: phaseSeconds - phaseElapsedSeconds,
    progressPercent: Math.round((elapsedSeconds / totalSeconds) * 100),
    isComplete: false,
  };
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
