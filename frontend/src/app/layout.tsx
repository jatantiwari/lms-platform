import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import NoRightClick from '@/components/ui/NoRightClick';

export const metadata: Metadata = {
  title: { default: 'ADI Boost', template: '%s | ADI Boost' },
  description: 'Learn new skills from expert instructors. Build your future with quality online courses.',
  keywords: ['online learning', 'courses', 'tutorials', 'education'],
  openGraph: {
    type: 'website',
    siteName: 'ADI Boost',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NoRightClick />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
