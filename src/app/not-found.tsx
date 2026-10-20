import Link from 'next/link';

export const metadata = {
  title: '404 - Sayfa Bulunamadı | Sesli Oyun Dünyası',
};

export default function NotFound() {
  return (
    <div style={{ padding: '2rem 0', textAlign: 'center' }}>
      <h1>404 - Aradığınız Sayfa Bulunamadı</h1>
      <p style={{ fontSize: '1.15rem', maxWidth: '600px', margin: '1rem auto' }}>
        Ulaşmaya çalıştığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/" className="btn btn-primary">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
