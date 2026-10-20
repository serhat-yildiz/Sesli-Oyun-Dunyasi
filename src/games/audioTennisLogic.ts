export interface TennisMatchState {
  playerScore: number;
  opponentScore: number;
  rallyCount: number;
  targetScore: number;
  ballSpeedMs: number; // Topun bir uçtan diğerine gitme süresi
}

export const INITIAL_TENNIS_STATE: TennisMatchState = {
  playerScore: 0,
  opponentScore: 0,
  rallyCount: 0,
  targetScore: 5,
  ballSpeedMs: 1600, // Başlangıçta 1.6 saniye
};

export type HitTiming = 'too_early' | 'good' | 'perfect' | 'late' | 'miss';

/**
 * Topun vuruş aralığını analiz et (0.0: Rakipte, 1.0: Tam oyuncunun raketinde)
 */
export function evaluateTiming(progress: number): HitTiming {
  if (progress < 0.65) {
    return 'too_early'; // Çok erken, raket boşa savruldu
  } else if (progress >= 0.70 && progress < 0.88) {
    return 'good'; // İyi vuruş
  } else if (progress >= 0.88 && progress <= 1.05) {
    return 'perfect'; // Mükemmel vuruş (En sert ve hızlı)
  } else if (progress > 1.05 && progress <= 1.20) {
    return 'late'; // Çok geç vuruş
  } else {
    return 'miss'; // Tamamen kaçırıldı
  }
}
