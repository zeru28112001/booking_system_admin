'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MaintenanceBanner } from '../maintenance-banner';
import { useAuth } from '@/context/auth-context';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-medium text-zinc-400">
            {isLoading ? 'Verifying session...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <MaintenanceBanner />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
