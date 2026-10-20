export type Direction = 'north' | 'east' | 'south' | 'west';

export interface Position {
  x: number;
  y: number;
}

export interface KeyItem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface MonsterState {
  x: number;
  y: number;
  active: boolean;
}

/**
 * 7x7 Labirent Haritası (0: Geçilebilir Koridor, 1: Taş Duvar, 2: Kilitli Çıkış Kapısı)
 */
export const LABYRINTH_MAP: number[][] = [
  [1, 1, 1, 2, 1, 1, 1], // (3, 0) Çıkış Kapısı
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

export const INITIAL_PLAYER_POS: Position = { x: 3, y: 5 }; // Giriş noktası
export const INITIAL_KEYS: KeyItem[] = [
  { id: 1, x: 1, y: 1, collected: false }, // Sol üst köşe
  { id: 2, x: 5, y: 1, collected: false }, // Sağ üst köşe
  { id: 3, x: 3, y: 3, collected: false }, // Merkez oda
];

export const INITIAL_MONSTER_POS: Position = { x: 1, y: 3 };

export function getNextPosition(pos: Position, dir: Direction): Position {
  switch (dir) {
    case 'north':
      return { x: pos.x, y: pos.y - 1 };
    case 'east':
      return { x: pos.x + 1, y: pos.y };
    case 'south':
      return { x: pos.x, y: pos.y + 1 };
    case 'west':
      return { x: pos.x - 1, y: pos.y };
  }
}

export function rotateDirection(current: Direction, turn: 'left' | 'right'): Direction {
  const dirs: Direction[] = ['north', 'east', 'south', 'west'];
  const currentIndex = dirs.indexOf(current);
  if (turn === 'right') {
    return dirs[(currentIndex + 1) % 4];
  } else {
    return dirs[(currentIndex + 3) % 4];
  }
}

export function getDirectionTurkish(dir: Direction): string {
  switch (dir) {
    case 'north':
      return 'Kuzey';
    case 'east':
      return 'Doğu';
    case 'south':
      return 'Güney';
    case 'west':
      return 'Batı';
  }
}

/**
 * Oyuncunun yönüne göre bir hedefin (anahtar veya yaratık)
 * göreceli açısını ve stereo panner değerini hesaplar (-1 sol, 0 ön/arka, 1 sağ)
 */
export function calculateRelativeSoundAngle(
  playerPos: Position,
  playerDir: Direction,
  targetPos: Position
): { pan: number; distance: number; relativeSide: string } {
  const dx = targetPos.x - playerPos.x;
  const dy = targetPos.y - playerPos.y;
  const distance = Math.hypot(dx, dy);

  // Dünya koordinatlarında açı (Radyan cinsinden, 0 = Doğu, pi/2 = Güney...)
  // Bizim için Kuzey (dy < 0), Doğu (dx > 0)
  let angle = Math.atan2(dy, dx); // [-PI, PI]

  let playerHeading = 0;
  if (playerDir === 'east') playerHeading = 0;
  else if (playerDir === 'south') playerHeading = Math.PI / 2;
  else if (playerDir === 'west') playerHeading = Math.PI;
  else if (playerDir === 'north') playerHeading = -Math.PI / 2;

  let relAngle = angle - playerHeading;
  // Normalize et [-PI, PI]
  while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
  while (relAngle < -Math.PI) relAngle += 2 * Math.PI;

  // sin(relAngle) bize sol-sağ eksenini verir (-1 sol, 1 sağ)
  const pan = Math.sin(relAngle);

  let relativeSide = 'tam önünde';
  if (Math.abs(relAngle) < Math.PI / 6) {
    relativeSide = 'tam önünde';
  } else if (Math.abs(relAngle) > (5 * Math.PI) / 6) {
    relativeSide = 'arkanda';
  } else if (pan > 0) {
    relativeSide = 'sağında';
  } else {
    relativeSide = 'solunda';
  }

  return { pan, distance, relativeSide };
}
