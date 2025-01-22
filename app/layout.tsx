'use client'

import './globals.css';
import { Inter, Roboto } from 'next/font/google';
import { ThemeProvider } from './providers/ThemeProvider';
import Header from './components/Header';
import BackgroundContainer from './components/BackgroundContainer';
import { Suspense } from 'react';
import { AuthProvider } from "./providers/AuthProvider";
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${roboto.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <BackgroundContainer>
              <div className="app-layout">
                <Suspense fallback={<div>Loading...</div>}>
                  <Header />
                </Suspense>
                <main className="container mx-auto">{children}</main>
                <footer className="footer text-center p-4">
                  <p>© {new Date().getFullYear()} Fotis Agro Trading Platform</p>
                </footer>
              </div>
            </BackgroundContainer>
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
