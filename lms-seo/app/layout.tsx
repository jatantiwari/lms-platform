import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Financial Freedom Mentor - Learn, Invest, Grow | Ride the Bull, Rule the Bear',
  description: 'Master stock market trading with Financial Freedom Mentor. Learn proven strategies, ride the bull, and rule the bear. Expert mentorship for financial freedom.',
  keywords: ['stock market', 'trading', 'investing', 'mentorship', 'financial freedom', 'bull market', 'bear market', 'trading strategies', 'wealth building'],
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://financialfreedommentor.com',
    siteName: 'Financial Freedom Mentor',
    title: 'Financial Freedom Mentor - Learn, Invest, Grow',
    description: 'Master stock market trading with expert mentorship. Ride the bull, rule the bear.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Financial Freedom Mentor - Learn, Invest, Grow',
    description: 'Master stock market trading with expert mentorship. Ride the bull, rule the bear.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Financial Freedom Mentor',
    description: 'Master commodity trading and investing. Learn, Invest, Grow. Ride the Bull, Rule the Bear.',
    url: 'https://www.ffmentor.com',
    logo: 'https://www.ffmentor.com/logo.png',
    sameAs: [
      'https://www.instagram.com/yours_ffmentor/',
      'https://www.facebook.com/yoursffmentor',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+91-80001-60017',
      email: 'ffmentor2024@gmail.com',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '5000',
    },
  };

  return (
    <html lang="en" className="dark bg-background">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
