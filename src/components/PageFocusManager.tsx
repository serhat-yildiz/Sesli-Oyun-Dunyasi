'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAnnouncer } from '@/context/AnnouncerContext';

/**
 * PageFocusManager
 * Next.js SPA sayfa geçişlerinde:
 * 1. Sayfa başlığını (document.title) ekran okuyucuya aria-live ile polite olarak duyurur.
 * 2. Sayfanın ana h1 başlığına veya main içeriğine klavye odağını otomatik taşır.
 * 3. Ekran okuyucunun kullanıcının nerede olduğunu kaybetmesini engeller.
 */
export default function PageFocusManager() {
  const pathname = usePathname();
  const { announce } = useAnnouncer();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // İlk sayfa yüklemesinde değil, sonraki yönlendirmelerde çalıştır
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Başlık ve odak taşıma
    const timer = setTimeout(() => {
      // 1. Odaklanacak öğeyi bul (tercihen h1, yoksa main)
      const h1Element = document.querySelector('h1') as HTMLElement | null;
      const mainElement = document.getElementById('main-content') as HTMLElement | null;

      const target = h1Element || mainElement;
      if (target) {
        // h1 normalde odaklanabilir değildir, programatik odaklanabilmesi için tabindex="-1" verilir
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus();
      }

      // 2. Ekran okuyucuya sayfa başlığını duyur
      const currentTitle = document.title || 'Sayfa yüklendi';
      announce(`${currentTitle} sayfasına geçildi.`, 'polite');
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, announce]);

  return null;
}
