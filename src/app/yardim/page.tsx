import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Nasıl Kullanılır ve Yardım - Sesli Oyun Dünyası',
};

export default function HelpPage() {
  return (
    <div>
      <header>
        <h1>Nasıl Kullanılır? & Ekran Okuyucu Kılavuzu</h1>
        <p style={{ fontSize: '1.15rem' }}>
          Bu kılavuz, sitede yalnızca klavye ve ekran okuyucu (NVDA, JAWS, Narrator) kullanarak en rahat nasıl gezinebileceğinizi anlatır.
        </p>
      </header>

      {/* Genel Klavye Kısayolları */}
      <section aria-labelledby="general-keyboard-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="general-keyboard-heading">1. Genel Web Gezinme Kısayolları</h2>
        <p>Platformumuz standart tarayıcı ve erişilebilirlik protokollerine tamamen sadıktır:</p>

        <table className="key-table" aria-label="Genel Gezinme Tuş Tablosu">
          <thead>
            <tr>
              <th scope="col" style={{ width: '35%' }}>Tuş</th>
              <th scope="col">İşlevi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><kbd className="key-badge">Tab</kbd></td>
              <td>Bir sonraki etkileşimli öğeye (bağlantı, düğme, form alanı) gider.</td>
            </tr>
            <tr>
              <td><kbd className="key-badge">Shift + Tab</kbd></td>
              <td>Bir önceki etkileşimli öğeye geri döner.</td>
            </tr>
            <tr>
              <td><kbd className="key-badge">Enter</kbd></td>
              <td>Odaklanan bağlantıyı açar veya form/düğmeyi etkinleştirir.</td>
            </tr>
            <tr>
              <td><kbd className="key-badge">Boşluk (Space)</kbd></td>
              <td>Düğmelere basar, onay kutularını (checkbox) işaretler veya kaldırır.</td>
            </tr>
            <tr>
              <td><kbd className="key-badge">Escape</kbd></td>
              <td>Oyun oturumunu duraklatır ya da modal pencereleri kapatır.</td>
            </tr>
            <tr>
              <td><kbd className="key-badge">Yukarı / Aşağı Oklar</kbd></td>
              <td>Açılır listelerde (select) veya kaydırma çubuklarında (slider) gezinir.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Ekran Okuyucu İpuçları */}
      <section aria-labelledby="screen-reader-tips-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="screen-reader-tips-heading">2. Ekran Okuyucu İpuçları (NVDA, JAWS, Narrator)</h2>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Başlık Seviyeleri ile Hızlı Gezinme (H Tuşu)</h3>
          <p>
            Tüm sayfalarımız hiyerarşik başlık düzenine sahiptir. Sayfada sadece tek bir <code>&lt;h1&gt;</code> bulunur.
            NVDA veya JAWS kullanırken <kbd className="key-badge">H</kbd> tuşuna basarak başlıklar arasında hızlıca atlayabilir,
            <kbd className="key-badge">1</kbd>, <kbd className="key-badge">2</kbd>, <kbd className="key-badge">3</kbd> tuşlarıyla doğrudan seviyelere gidebilirsiniz.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Landmark (Bölge) Gezinmesi (D Tuşu)</h3>
          <p>
            NVDA ve JAWS&apos;ta <kbd className="key-badge">D</kbd> tuşuna basarak doğrudan sayfa landmark&apos;larına (Banner/Başlık, Navigation/Gezinme, Main/Ana İçerik, Contentinfo/Altbilgi) geçebilirsiniz.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Ana İçeriğe Atla (Skip Link)</h3>
          <p>
            Her sayfa yüklendiğinde basacağınız ilk <kbd className="key-badge">Tab</kbd> tuşu sizi &ldquo;Ana içeriğe geç&rdquo; bağlantısına odaklar.
            Enter&apos;a basarak üst menüyü doğrudan atlayıp ana başlığa ve oyun kartlarına geçebilirsiniz.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Dinamik Bildirimler (Aria-Live)</h3>
          <p>
            Ayarları değiştirdiğinizde veya sayfa değiştirdiğinizde ekran okuyucunuz odak bozulmadan arka planda bilgilendirilir (polite live region).
            Kendi ses motorumuz ekran okuyucunuzun konuştuğu anda konuşmaz; ses sadece oyun başladığında devreye girer.
          </p>
        </div>
      </section>

      {/* Sorun Giderme */}
      <section aria-labelledby="troubleshooting-heading" style={{ marginTop: '2.5rem' }}>
        <h2 id="troubleshooting-heading">3. Ses Sorunlarını Giderme</h2>
        <p>
          Tarayıcı güvenlik politikaları gereğince hiçbir web sayfası kullanıcının açık bir tıklaması veya tuş basışı olmadan ses çalamaz.
        </p>
        <p>
          Eğer oyun sayfasında ses duyamıyorsanız:
        </p>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
          <li>Sayfadaki <strong>&ldquo;Oyunu Başlat&rdquo;</strong> butonuna bastığınızdan emin olun.</li>
          <li>
            <Link href="/ayarlar" style={{ color: 'var(--primary-accent)', textDecoration: 'underline' }}>
              Ayarlar sayfasına giderek
            </Link> &ldquo;Sesi Test Et&rdquo; butonunu deneyin ve ses seviyenizi kontrol edin.
          </li>
          <li>Tarayıcı sekmesinin sessize alınmadığından emin olun (Edge ve Chrome&apos;da sekme üzerinde <kbd className="key-badge">Ctrl + M</kbd>).</li>
        </ul>
      </section>
    </div>
  );
}
