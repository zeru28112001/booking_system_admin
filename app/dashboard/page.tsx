'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  ShieldAlert,
  FileCheck,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Grid,
  Image as ImageIcon,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface Metrics {
  total_customers: number;
  total_providers: number;
  pending_verifications: number;
  pending_profile_requests: number;
  total_bookings: number;
  total_revenue: number;
}

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<Metrics>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await apiRequest('/admin/metrics');
      return res.data;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">System Dashboard</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time platform status, provider verification alerts, and analytics
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
            {(error as any).message || 'Failed to load dashboard metrics'}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Customers */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Customers
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {isLoading ? '...' : metrics?.total_customers ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Registered platform clients</p>
            </CardContent>
          </Card>

          {/* Service Providers */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Service Providers
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Briefcase className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {isLoading ? '...' : metrics?.total_providers ?? 0}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Active & pending providers</p>
            </CardContent>
          </Card>

          {/* Pending Verifications */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Pending Verifications
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-400">
                  {isLoading ? '...' : metrics?.pending_verifications ?? 0}
                </span>
                {(metrics?.pending_verifications ?? 0) > 0 && (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">
                    Action Needed
                  </Badge>
                )}
              </div>
              <Link
                href="/providers"
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium mt-2 transition-colors"
              >
                Review Provider Accounts <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Pending Profile Requests */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Profile Change Requests
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FileCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-300">
                {isLoading ? '...' : metrics?.pending_profile_requests ?? 0}
              </div>
              <Link
                href="/profile-requests"
                className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium mt-2 transition-colors"
              >
                Inspect Edit Requests <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Total Bookings */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Bookings
              </CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">
                {isLoading ? '...' : metrics?.total_bookings ?? 0}
              </div>
              <Link
                href="/bookings"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors"
              >
                Open Bookings Explorer <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Volume / Revenue
              </CardTitle>
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-300">
                {isLoading ? '...' : `$${(metrics?.total_revenue ?? 0).toLocaleString()}`}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Platform gross transaction value</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Hub */}
        <div className="pt-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
            Quick Actions & Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/categories">
              <Card className="bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                      <Grid className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Categories CRUD</p>
                      <p className="text-xs text-zinc-400">Manage service categories with icon grid</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/banners">
              <Card className="bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Promo Banners</p>
                      <p className="text-xs text-zinc-400">Configure promotional sliders & banners</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">System Settings</p>
                      <p className="text-xs text-zinc-400">Maintenance mode & contact details</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

