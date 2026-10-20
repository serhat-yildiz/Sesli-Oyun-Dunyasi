import React from 'react';

/**
 * SkipLink (Ana İçeriğe Geç Bağlantısı)
 * Klavye ve ekran okuyucu kullanıcılarının başlık ve gezinme çubuğunu
 * atlayarak doğrudan asıl içeriğe geçmesini sağlar (WCAG 2.4.1).
 */
export default function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Ana içeriğe geç
    </a>
  );
}
