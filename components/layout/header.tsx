'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ShieldCheck } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-zinc-300">Overview</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-10 flex items-center gap-3 px-3 hover:bg-zinc-900 rounded-full outline-none transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 border border-zinc-700">
              <AvatarImage src={user?.avatarUrl} alt={user?.fullName || 'Admin'} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-zinc-100">{user?.fullName || 'Admin User'}</p>
              <p className="text-[10px] text-indigo-400 font-mono font-medium">System Administrator</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-200" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-zinc-100">{user?.fullName}</p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer text-xs">
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
              Role: {user?.role?.toUpperCase()}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={logout}
              className="focus:bg-red-500/10 text-red-400 focus:text-red-300 cursor-pointer text-xs"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
