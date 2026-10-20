export type TennisZone = 'left' | 'center' | 'right';

export interface TennisMatchState {
  playerScore: number;
  opponentScore: number;
  rallyCount: number;
  targetScore: number;
  ballSpeedMs: number;
}

export const INITIAL_TENNIS_STATE: TennisMatchState = {
  playerScore: 0,
  opponentScore: 0,
  rallyCount: 0,
  targetScore: 5,
  ballSpeedMs: 1500,
};

export type HitTiming = 'too_early' | 'good' | 'perfect' | 'late' | 'miss';

export function evaluateTiming(progress: number): HitTiming {
  if (progress < 0.65) {
    return 'too_early';
  } else if (progress >= 0.70 && progress < 0.88) {
    return 'good';
  } else if (progress >= 0.88 && progress <= 1.05) {
    return 'perfect';
  } else if (progress > 1.05 && progress <= 1.20) {
    return 'late';
  } else {
    return 'miss';
  }
}
