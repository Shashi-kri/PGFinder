import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'PG Finder — Find PGs, Flats & Flatmates Near You',
  description: 'Discover verified PGs, flats, flatmate rooms and mess services near you. Filter by location, budget, food preference and more. Connect with hosts directly.',
  keywords: 'PG, paying guest, flat, flatmate, mess, accommodation, rent, India',
  openGraph: {
    title: 'PG Finder — Find Your Perfect PG',
    description: 'Discover verified PGs, flats, and flatmate rooms near you.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<div style={{ height: 'var(--nav-h)' }} />}>
              <Navbar />
            </Suspense>
            <main style={{ paddingTop: 'var(--nav-h)' }}>
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


