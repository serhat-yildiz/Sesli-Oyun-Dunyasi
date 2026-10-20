export interface FrequencyLevel {
  levelNumber: number;
  name: string;
  targetFrequency: number;
  initialFrequency: number;
  tolerance: number; // Kabul edilebilir hata payı (Hz)
  description: string;
}

export const FREQUENCY_LEVELS: FrequencyLevel[] = [
  {
    levelNumber: 1,
    name: 'Derin Bas Rezonansı',
    targetFrequency: 130, // C3 civarı
    initialFrequency: 115,
    tolerance: 2,
    description: 'Kalın bas tonunu eşleştirin. Sol kulaktaki referans ile sağdaki ses arasındaki dalgalanmayı sıfırlayın.',
  },
  {
    levelNumber: 2,
    name: 'Orta Frekans Armonisi',
    targetFrequency: 220, // A3
    initialFrequency: 240,
    tolerance: 2,
    description: 'Orta seviye ton. Frekansı biraz pesleştirerek vuru titreşimini sakinleştirin.',
  },
  {
    levelNumber: 3,
    name: 'Konser La (A440)',
    targetFrequency: 440, // A4
    initialFrequency: 425,
    tolerance: 1.5,
    description: 'Evrensel akort standardı 440 Hertz. Ses dalgası titreşimi durana kadar tizleştirin.',
  },
  {
    levelNumber: 4,
    name: 'Kristal Tizler',
    targetFrequency: 587, // D5
    initialFrequency: 610,
    tolerance: 1.5,
    description: 'İnce ve parlak kristal frekans. Dikkatli olun, dalgalanma çok hızlıdır.',
  },
  {
    levelNumber: 5,
    name: 'Kuantum Frekans Kilidi',
    targetFrequency: 880, // A5
    initialFrequency: 860,
    tolerance: 1.0,
    description: 'Son modül! Son derece hassas mikro adımlarla (Sağ/Sol Ok tuşları) akort edin.',
  },
];
