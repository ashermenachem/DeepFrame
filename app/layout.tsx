import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const deploymentHost = process.env.VERCEL_URL;
const siteOrigin = productionHost
  ? `https://${productionHost}`
  : deploymentHost
    ? `https://${deploymentHost}`
    : 'http://localhost:3000';

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
  title: 'Photo Data Finder by Asher Menachem',
  description:
    'Every field. Zero uploads. Inspect complete photo metadata privately in your browser.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Photo Data Finder',
    description: 'Every field. Zero uploads. A private photo metadata inspector by Asher Menachem.',
    url: '/',
    siteName: 'Photo Data Finder',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Photo Data Finder — Every field. Zero uploads. By Asher Menachem.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photo Data Finder',
    description: 'Every field. Zero uploads. A private photo metadata inspector by Asher Menachem.',
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
