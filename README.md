# 🎧 Sesli Oyun Dünyası (Audio Gaming Platform)

Görme engelli ve az gören bireyler için tasarlanmış, **WCAG 2.2 Seviye AA** standartlarıyla tam uyumlu, klavye ve ekran okuyucu (NVDA, JAWS, Windows Narrator) odaklı Türkçe sesli oyun platformu iskeleti.

---

## 🌟 Temel Özellikler

- **Sıfır Fare Bağımlılığı:** Tüm arayüz yalnızca `Tab`, `Shift+Tab`, `Enter`, `Boşluk (Space)` ve `Escape` ile yönetilebilir.
- **Ekran Okuyucu Dostu:** Kendi konuşma sentezini zorlamak yerine ekran okuyucunun dilini bozmayan `aria-live` (polite ve assertive) kanalları.
- **Landmark Mimarisi:** Doğru `header`, `nav`, `main` ve `footer` semantiği. Her sayfada tek bir `h1` başlığı.
- **Gelişmiş Odak Yönetimi:** 
  - İlk `Tab` tuşunda beliren **"Ana içeriğe geç" (Skip Link)** bağlantısı.
  - Sayfa geçişlerinde odağı doğrudan ana başlığa veya içeriğe taşıyan ve sayfa başlığını ekran okuyucuya okutan `PageFocusManager`.
  - En az 3px kalınlığında, `outline-offset` ile ayrılmış çift katmanlı yüksek kontrastlı odak halkası (`:focus-visible`).
- **Web Audio API Entegrasyonu:** Tarayıcı politikalarına uygun olarak kullanıcı etkileşimi olmadan (ör. "Oyunu Başlat" butonu) ses başlatılmaz. Ekran okuyucu sesini ezmeyen hafif frekans tonları.
- **Kişiselleştirilebilir Erişilebilirlik:**
  - Ses seviyesi ayarı
  - Anlatım hızı çarpanı
  - Oyun zorluğu seçimi
  - Yüksek Kontrast Modu (Saf siyah/sarı 7:1 AAA uyumu)
  - Büyük Yazı Modu
  - Tercihler `localStorage` içinde saklanır ve tüm sitede anında uygulanır.
- **Yeni Oyun Ekleme Altyapısı:** `src/games/registry.ts` dosyasına bir nesne ekleyerek anında yeni bir oyun sayfası, tuş şeması ve oyun yuvası oluşturulabilir.

---

## 🚀 Kurulum ve Çalıştırma

Gereksinimler: Node.js 18+ ve npm

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

3. **Üretim (Production) Derlemesi ve Çalıştırma:**
   ```bash
   npm run build
   npm run start
   ```

4. **Vercel'e Dağıtım (Deploy):**
   Proje standart Next.js App Router yapısındadır. GitHub reponuzu Vercel'e bağladığınızda sıfır konfigürasyon ile doğrudan derlenip yayına alınır.

---

## 📂 Sayfa Yapısı

1. **Ana Sayfa (`/`):** Platform vizyonu, erişilebilirlik ilkeleri ve öne çıkan oyunların listesi.
2. **Oyunlar Kataloğu (`/oyunlar`):** Tüm oyunların tür etiketleri (Korku, Macera, Bulmaca) ve "Yakında" rozetleriyle listelendiği semantik kart yapısı.
3. **Dinamik Oyun Şablonu (`/oyunlar/[slug]`):**
   - Oyun kuralları (Nasıl oynanır)
   - Tuş kontrolleri tablosu
   - Kulaklık önerisi ve korku türü için içerik uyarıları
   - "Oyunu Başlat", "Duraklat" ve "Çık" düğmeleri
   - `Escape` tuşu ile duraklatma ve eylemleri dinleyen oyun alanı bileşen yuvası
4. **Ayarlar (`/ayarlar`):** Ses seviyesi slider'ı, ses testi, kontrast modu ve büyük yazı modu.
5. **Nasıl Kullanılır (`/yardim`):** Klavye navigasyonu, NVDA/JAWS hızlı tuşları (H, D) ve ses sorunlarını giderme rehberi.
6. **Hakkında ve İletişim (`/hakkinda-iletisim`):** Geri bildirim formu; eksik alanlarda `aria-describedby` ve `aria-invalid` ile ekran okuyucuya hata bildiren erişilebilir form.

---

## 🎮 Yeni Oyun Nasıl Eklenir?

Yeni bir oyun eklemek için `src/games/registry.ts` dizisindeki listeye yeni bir kayıt eklemeniz yeterlidir:

```typescript
{
  slug: 'yeni-oyun-adi',
  title: 'Yeni Oyunun Başlığı',
  category: 'Macera', // 'Korku' | 'Macera' | 'Bulmaca'
  shortDescription: 'Oyunun kısa tanıtımı...',
  howToPlay: ['1. Adım...', '2. Adım...'],
  keyBindings: [
    { key: 'W / Yukarı Ok', action: 'İleri git' },
    { key: 'Escape', action: 'Duraklat' }
  ],
  recommendedHeadphones: true,
  contentWarnings: [], // Gerekirse içerik uyarıları
  status: 'coming-soon',
  componentId: 'YeniOyunBileseni'
}
```
Next.js SSG altyapısı sayesinde `/oyunlar/yeni-oyun-adi` sayfası dinamik olarak otomatik üretilecektir.

---

## 🧪 Ekran Okuyucular ile Elle Test Rehberi

Aşağıdaki adımları Windows üzerinde **NVDA**, **JAWS** veya **Windows Narrator (Ekran Okuyucusu)** ile test edebilirsiniz:

### 1. Atlama Bağlantısı (Skip Link) Testi
1. Tarayıcıyı açın ve sayfayı yenileyin (`F5`).
2. Klavyeden **Tab** tuşuna 1 kez basın.
3. Ekran okuyucunun *"Ana içeriğe geç, bağlantı"* dediğini ve bağlantının ekranın sol üstünde sarı çerçeveyle belirdiğini doğrulayın.
4. **Enter** tuşuna basın. Odağın doğrudan `h1` ana başlığına atladığını gözlemleyin.

### 2. Sayfa Geçişi ve Odak Yönetimi Testi
1. Menüde gezinerek **Enter** ile `/oyunlar` sayfasına geçin.
2. Sayfa değiştiğinde `PageFocusManager`'ın ekran okuyucuya *"Oyunlar - Sesli Oyun Dünyası sayfasına geçildi"* duyurusunu ilettiğini ve klavye odağının yeni sayfanın `<h1>` başlığına odaklandığını kontrol edin.

### 3. Oyun Sayfası ve Escape Kontrolü Testi
1. `/oyunlar/karanlik-koridor` sayfasına gidin.
2. Sayfada **H** tuşu ile başlıkları sırasıyla gezin (Nasıl Oynanır -> Tuş Kontrolleri -> Oyun Kontrolü).
3. **Tab** ile ilerleyip **"▶ Oyunu Başlat"** düğmesine **Boşluk** veya **Enter** ile basın.
4. Ses oturumunun açıldığını ve ekran okuyucunun *"Karanlık Koridor oyunu başlatıldı! Ses motoru devrede."* duyurusu yaptığını duyun.
5. Yön tuşlarına (`W`, `A`, `S`, `D` veya ok tuşları) basın; her adımda yön bildiriminin yapıldığını ve stereo ses tonu üretildiğini test edin.
6. **Escape** tuşuna basın; oyunun duraklatıldığını, tekrar **Escape** tuşuna basıldığında devam ettiğini doğrulayın.

### 4. Ayarlar Sayfası Testi
1. `/ayarlar` sayfasına gidin.
2. Ses seviyesi kaydırıcısına gelin; sol/sağ ok tuşlarıyla değeri değiştirin. Ekran okuyucunun değeri yüzde olarak okuduğunu (`aria-valuetext`) doğrulayın.
3. "Yüksek Kontrast Modu" onay kutusunu **Boşluk** tuşu ile işaretleyin. Ekran okuyucunun polite duyurusunu ve sayfanın saf siyah/sarı yüksek kontrast moduna geçtiğini gözlemleyin.
4. Başka bir sayfaya geçip geri döndüğünüzde ayarların korunduğunu (localStorage) doğrulayın.

### 5. Form ve Hata Bildirimi Testi
1. `/hakkinda-iletisim` sayfasına gidin.
2. Alanları boş bırakarak **"Mesajı Gönder"** düğmesine basın.
3. Formun gönderilmediğini, ekran okuyucunun *"Formda eksik veya hatalı alanlar var"* duyurusu yaptığını ve odağın ilk hatalı alana yönlendirildiğini doğrulayın.
