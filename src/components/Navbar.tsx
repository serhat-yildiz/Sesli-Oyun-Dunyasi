'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/oyunlar', label: 'Oyunlar' },
    { href: '/ayarlar', label: 'Ayarlar' },
    { href: '/yardim', label: 'Nasıl Kullanılır' },
    { href: '/hakkinda-iletisim', label: 'Hakkında ve İletişim' },
  ];

  return (
    <header className="site-header" role="banner">
      <div className="site-container header-inner">
        <div>
          <Link href="/" className="site-title-link">
            <span aria-hidden="true">🎧</span>
            <span>Sesli Oyun Dünyası</span>
          </Link>
        </div>

        <nav className="site-nav" aria-label="Ana Menü">
          <ul>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="nav-link"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
