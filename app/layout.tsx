'use client';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { useEffect } from 'react';
import './globals.css';
import { applySavedTheme } from '@/lib/theme';

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Metadata needs to be exported from a separate file or use generateMetadata
// Since we're using 'use client', we'll keep metadata in a separate file or use next/head
// For simplicity, we'll use a separate metadata file

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Apply saved theme on mount
  useEffect(() => {
    applySavedTheme();
  }, []);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
