import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeepFrame by Asher Menachem',
    short_name: 'DeepFrame',
    description:
      'Reveal complete photo metadata privately in your browser—every field, with zero uploads.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05060a',
    theme_color: '#05060a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
