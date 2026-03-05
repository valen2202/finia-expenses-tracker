import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinIA – Asistente financiero',
  description: 'Registrá gastos en lenguaje natural con tu asistente financiero personal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <AppProvider>
          <Navigation />
          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
