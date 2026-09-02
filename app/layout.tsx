import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://photo-data-finder.ashermenachem.chatgpt.site'),
  title: 'Photo Data Finder — See what your photo knows',
  description:
    'Inspect every metadata field embedded in a photo, privately in your browser.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Photo Data Finder',
    description: 'See what your photo knows. Inspect every embedded metadata field privately in your browser.',
    url: '/',
    siteName: 'Photo Data Finder',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Photo Data Finder — See what your photo knows.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photo Data Finder',
    description: 'See what your photo knows. Inspect every embedded metadata field privately in your browser.',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
