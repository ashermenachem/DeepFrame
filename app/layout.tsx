import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
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
    'DeepFrame reveals complete photo metadata, saves your private inspection history, and helps remove sensitive metadata.',
  applicationName: 'DeepFrame',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'DeepFrame',
    description:
      'DeepFrame is a private photo metadata inspector with secure accounts, saved history, and privacy tools.',
    url: '/',
    siteName: 'DeepFrame',
    type: 'website',
    images: [
      {
        url: '/brand/deepframe-social.png',
        width: 1200,
        height: 630,
        alt: 'DeepFrame — Every field, clearly explained. By Asher Menachem.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeepFrame',
    description:
      'DeepFrame is a private photo metadata inspector with saved history and privacy tools.',
    images: ['/brand/deepframe-social.png'],
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetBrainsMono.variable}`}
    >
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
