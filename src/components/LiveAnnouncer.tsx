'use client';

import React from 'react';
import { useAnnouncer } from '@/context/AnnouncerContext';

/**
 * LiveAnnouncer
 * Ekran okuyucular için dinamik duyuruları seslendiren görünmez aria-live alanları.
 * polite: Kullanıcının dinlemesini bölmeden sıraya koyar (ör. sayfa değişti, ayar kaydedildi).
 * assertive: Acil durum duyuruları (ör. oyun duraklatıldı, kritik hata).
 */
export default function LiveAnnouncer() {
  const { politeMessage, assertiveMessage } = useAnnouncer();

  return (
    <>
      <div
        id="announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      <div
        id="announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  );
}
