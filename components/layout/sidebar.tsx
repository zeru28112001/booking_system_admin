'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Grid,
  Image as ImageIcon,
  FileCheck,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Providers', href: '/providers', icon: Users },
  { name: 'Bookings Explorer', href: '/bookings', icon: Calendar },
  { name: 'Categories', href: '/categories', icon: Grid },
  { name: 'Promo Banners', href: '/banners', icon: ImageIcon },
  { name: 'Profile Requests', href: '/profile-requests', icon: FileCheck },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-zinc-100 tracking-tight leading-none">
            Admin Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Booking Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mb-2">
          Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className={cn('h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all', isActive && 'opacity-100 translate-x-0 text-indigo-400')} />
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/80 text-xs">
          <p className="text-zinc-300 font-medium">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 text-[11px]">Backend API Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
