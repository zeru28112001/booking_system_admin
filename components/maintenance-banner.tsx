'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial state
    apiRequest('/settings/public')
      .then((res) => {
        if (res.data?.isMaintenanceMode !== undefined) {
          setIsMaintenance(Boolean(res.data.isMaintenanceMode));
        }
      })
      .catch(() => {});

    // Setup Socket.IO
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('maintenance_mode_changed', (data: { isMaintenanceMode?: boolean; isMaintenance?: boolean }) => {
      const mode = data.isMaintenanceMode ?? data.isMaintenance ?? false;
      setIsMaintenance(Boolean(mode));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!isMaintenance) return null;

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-amber-500">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 animate-pulse text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold">System Maintenance Mode is ACTIVE</p>
            <p className="text-xs text-amber-400/90">
              Customer and Provider operations are restricted. Real-time Socket status: {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
