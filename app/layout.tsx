import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Portal - Service Booking Platform',
  description: 'Control panel and administration management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" theme="dark" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
