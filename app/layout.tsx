import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const siteOrigin = 'https://deepframe-photo.vercel.app';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
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
    description: 'DeepFrame is a private photo metadata inspector by Asher Menachem. Every field. Zero uploads.',
    url: '/',
    siteName: 'DeepFrame',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'DeepFrame — Every field. Zero uploads. By Asher Menachem.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeepFrame',
    description: 'DeepFrame is a private photo metadata inspector by Asher Menachem. Every field. Zero uploads.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
