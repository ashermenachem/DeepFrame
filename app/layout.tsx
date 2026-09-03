import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const siteOrigin = 'https://deepframesearch.vercel.app';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'DeepFrame by Asher Menachem',
  description:
    'DeepFrame reveals complete photo metadata privately in your browser—every field, with zero uploads.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'DeepFrame',
    description:
      'DeepFrame is a private photo metadata inspector by Asher Menachem. Every field. Zero uploads.',
    url: '/',
    siteName: 'DeepFrame',
    type: 'website',
    images: [
      {
        url: '/og-v2.png',
        width: 1734,
        height: 907,
        alt: 'DeepFrame — Every field. Zero uploads. By Asher Menachem.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeepFrame',
    description:
      'DeepFrame is a private photo metadata inspector by Asher Menachem. Every field. Zero uploads.',
    images: ['/og-v2.png'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#05060a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
