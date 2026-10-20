import { GameDefinition } from './types';

/**
 * Oyun Kayıt Defteri (Registry)
 * Yeni bir oyun eklemek için sadece bu listeye yeni bir nesne tanımlamak yeterlidir.
 */
export const GAME_REGISTRY: GameDefinition[] = [
  {
    slug: 'karanlik-koridor',
    title: 'Karanlık Koridor',
    category: 'Korku',
    shortDescription: 'Yankılanan ayak sesleri ve fısıltılar arasında sadece kulaklarınızı kullanarak terk edilmiş bir malikaneden kaçın.',
    howToPlay: [
      'Kulaklığınızı takın ve seslerin hangi yönden (sol / sağ) geldiğine dikkat edin.',
      'Canavarın hırıltısı yaklaştığında sessiz olun veya ters yöne ilerleyin.',
      'Kapı kilitlerinin tıkırtısını duyduğunuzda doğru anahtarı aramak için etkileşim tuşunu kullanın.',
      'Her an duraklatmak veya çıkmak için Escape tuşuna basabilirsiniz.'
    ],
    keyBindings: [
      { key: 'W veya Yukarı Ok', action: 'İleri Adım At' },
      { key: 'S veya Aşağı Ok', action: 'Geri Adım At' },
      { key: 'A veya Sol Ok', action: 'Sola Dön / Solu Dinle (90 Derece)' },
      { key: 'D veya Sağ Ok', action: 'Sağa Dön / Sağı Dinle (90 Derece)' },
      { key: 'C', action: 'Çömel / Nefesini Tut (Varlık geçerken sessiz kal)' },
      { key: 'R', action: 'Çevre ve Yön Durum Raporunu Dinle' },
      { key: 'Boşluk (Space)', action: 'Etkileşime Geç / Anahtarı Al / Kapıyı Yokla' },
      { key: 'Escape', action: 'Oyunu Duraklat / Menüye Dön' }
    ],
    contentWarnings: [
      'Ani yüksek sesler ve gerilimli ses efektleri içerir.',
      'Karanlık ve klostrofobik atmosfer sesleri mevcuttur.'
    ],
    recommendedHeadphones: true,
    status: 'available',
    componentId: 'DarkCorridorGame'
  },
  {
    slug: 'kayip-pusula',
    title: 'Kayıp Pusula',
    category: 'Macera',
    shortDescription: 'Rüzgarın yönü, dalga sesleri ve egzotik kuş çağrılarıyla bilinmeyen bir adanın gizemini çözün.',
    howToPlay: [
      'Farklı çevre seslerini (akarsu, rüzgar, tapınak çanı) takip ederek haritada ilerleyin.',
      'Yol ayrımına geldiğinizde çevrenizdeki sesleri dinleyip en güvenli yönü seçin.',
      'Adadaki gizli parşömenleri toplamak için sesli ipuçlarını takip edin.'
    ],
    keyBindings: [
      { key: 'W veya Yukarı Ok', action: 'Patikada İleri Yürü (Zemin sesini dinle)' },
      { key: 'S veya Aşağı Ok', action: 'Geri Adım At' },
      { key: 'A veya Sol Ok', action: 'Sola Dön (Okyanus ve rüzgarın stereo yönü değişir)' },
      { key: 'D veya Sağ Ok', action: 'Sağa Dön' },
      { key: 'P', action: 'Akustik Pusulayı Çalıştır (En yakın totemin sonar sesini dinle)' },
      { key: 'M veya R', action: 'Çevre, Arazi ve Konum Raporunu Seslendir' },
      { key: 'Boşluk (Space)', action: 'Totem Taşını Al / Fener Sunağına Yerleştir' },
      { key: 'Escape', action: 'Oyunu Duraklat / Menü' }
    ],
    contentWarnings: [],
    recommendedHeadphones: true,
    status: 'available',
    componentId: 'LostCompassGame'
  },
  {
    slug: 'frekans-avcilari',
    title: 'Frekans Avcıları',
    category: 'Bulmaca',
    shortDescription: 'Müzikal tonları eşleştirin, akort hatalarını düzeltin ve ses frekanslarını senkronize edin.',
    howToPlay: [
      'Referans olarak çalınan ses notasını dinleyin.',
      'Kontrol ettiğiniz frekansı ok tuşlarıyla tizleştirin veya pesleştirin.',
      'İki ses arasındaki vuru (dalgalanma) sıfırlandığında doğru notayı bulmuş olursunuz. Boşluk tuşuyla onaylayın.'
    ],
    keyBindings: [
      { key: 'Yukarı Ok veya W', action: 'Frekansı Tizleştir (+5 Hz)' },
      { key: 'Aşağı Ok veya S', action: 'Frekansı Pesleştir (-5 Hz)' },
      { key: 'Sağ Ok veya D', action: 'Hassas Mikro Tizleştir (+1 Hz)' },
      { key: 'Sol Ok veya A', action: 'Hassas Mikro Pesleştir (-1 Hz)' },
      { key: 'R', action: 'Hedef Referans Sesi Solo Olarak Dinle' },
      { key: 'P', action: 'Frekans Analiz Raporunu ve İpucunu Seslendir' },
      { key: 'Boşluk (Space)', action: 'Frekansı Kilitle ve Modülü Onayla' },
      { key: 'Escape', action: 'Oyunu Duraklat / Menü' }
    ],
    contentWarnings: [],
    recommendedHeadphones: true,
    status: 'available',
    componentId: 'FrequencyHuntersGame'
  },
  {
    slug: 'akustik-tenis',
    title: 'Akustik Tenis: Ses Kortu',
    category: 'Spor',
    shortDescription: 'Sol kulaktan sağ kulağa seken topu tam zamanında yakalayın, sert vuruşlarla rakibinizi alt edin.',
    howToPlay: [
      'Kulaklığınızı takın ve sol kulaktan gelen servis sesini dinleyin.',
      'Top masada sekip sağ kulağınıza ulaştığında tam zamanında Boşluk tuşuna basarak raket vurun.',
      'Ralli uzadıkça topun gidiş geliş temposu artar. 5 puana ilk ulaşan maçı kazanır!'
    ],
    keyBindings: [
      { key: 'Boşluk (Space)', action: 'Düz ve Sert Raket Vuruşu' },
      { key: 'Sol Ok', action: 'Sol Köşeye Falsolu Vuruş' },
      { key: 'Sağ Ok', action: 'Sağ Köşeye Falsolu Vuruş' },
      { key: 'P veya R', action: 'Mevcut Skor ve Ralli Durumunu Seslendir' },
      { key: 'Escape', action: 'Maçı Duraklat / Menü' }
    ],
    contentWarnings: [],
    recommendedHeadphones: true,
    status: 'available',
    componentId: 'AudioTennisGame'
  }
];

export function getAllGames(): GameDefinition[] {
  return GAME_REGISTRY;
}

export function getGameBySlug(slug: string): GameDefinition | undefined {
  return GAME_REGISTRY.find(game => game.slug === slug);
}
