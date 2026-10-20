export type TerrainType = 'sand' | 'grass' | 'stone' | 'water' | 'cliffs';

export interface IslandPosition {
  x: number;
  y: number;
}

export interface TotemStone {
  id: number;
  name: string;
  x: number;
  y: number;
  collected: boolean;
  element: 'Ateş' | 'Su' | 'Toprak' | 'Hava';
}

/**
 * 8x8 Sisli Ada Haritası
 * 'S': Sahil / Kumsal (Sand)
 * 'G': Yağmur Ormanı / Çimen (Grass)
 * 'T': Taş / Kadim Tapınak (Stone)
 * 'W': Okyanus Suyu (Aşılamaz - Water)
 * 'C': Sarp Kayalıklar (Cliffs)
 * 'L': Fener Kulesi (Lighthouse - Çıkış noktası: x=3, y=1)
 */
export const ISLAND_MAP: string[][] = [
  ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
  ['W', 'C', 'C', 'L', 'C', 'C', 'C', 'W'], // (3, 1) Deniz Feneri
  ['W', 'C', 'T', 'T', 'G', 'G', 'C', 'W'],
  ['W', 'G', 'G', 'T', 'G', 'G', 'G', 'W'],
  ['W', 'G', 'G', 'G', 'G', 'G', 'S', 'W'],
  ['W', 'S', 'G', 'G', 'G', 'S', 'S', 'W'],
  ['W', 'S', 'S', 'S', 'S', 'S', 'S', 'W'], // Güney Kumsalı (Başlangıç)
  ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
];

export const INITIAL_COMPASS_PLAYER_POS: IslandPosition = { x: 3, y: 6 }; // Güney sahili

export const INITIAL_TOTEMS: TotemStone[] = [
  { id: 1, name: 'Hava Totemi', x: 1, y: 5, collected: false, element: 'Hava' },
  { id: 2, name: 'Toprak Totemi', x: 6, y: 4, collected: false, element: 'Toprak' },
  { id: 3, name: 'Su Totemi', x: 2, y: 2, collected: false, element: 'Su' },
  { id: 4, name: 'Ateş Totemi', x: 5, y: 3, collected: false, element: 'Ateş' },
];

export const LIGHTHOUSE_POS: IslandPosition = { x: 3, y: 1 };

export function getTerrainName(code: string): { type: 'sand' | 'grass' | 'stone'; name: string } {
  switch (code) {
    case 'S':
      return { type: 'sand', name: 'Kumsal ve Islak Kumlar' };
    case 'G':
      return { type: 'grass', name: 'Yoğun Sisli Orman ve Yosunlu Patika' };
    case 'T':
      return { type: 'stone', name: 'Antik Taş Mabet Kalıntıları' };
    case 'L':
      return { type: 'stone', name: 'Tarihi Fener Kulesi Zirvesi' };
    default:
      return { type: 'sand', name: 'Bilinmeyen Arazi' };
  }
}
