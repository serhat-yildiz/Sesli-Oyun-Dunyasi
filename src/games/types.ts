export type GameCategory = 'Korku' | 'Macera' | 'Bulmaca' | 'Spor' | 'Hikaye';

export interface KeyBinding {
  key: string;
  action: string;
  description?: string;
}

export interface GameDefinition {
  slug: string;
  title: string;
  category: GameCategory;
  shortDescription: string;
  howToPlay: string[];
  keyBindings: KeyBinding[];
  contentWarnings?: string[];
  recommendedHeadphones: boolean;
  status: 'available' | 'coming-soon';
  // İleride bileşen dinamik render edileceği için bileşen anahtarı
  componentId?: string;
}
