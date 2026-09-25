'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/api';
import { Search, RefreshCw, Loader2, Eye, Clock, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Booking {
  _id?: string;
  id?: string;
  customerName?: string;
  providerName?: string;
  serviceTitle?: string;
  serviceName?: string;
  price?: number;
  status?: string;
  date?: string;
  notes?: string;
  createdAt?: string;
  customerId?: { _id?: string; name?: string; email?: string; phone?: string };
  providerId?: { _id?: string; name?: string; shopName?: string; address?: string; phone?: string };
  customer?: { fullName?: string; name?: string; email?: string };
  provider?: { fullName?: string; name?: string; businessName?: string; shopName?: string };
  service?: { title?: string; name?: string; price?: number };
}

interface PaginatedBookingsResponse {
  items: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<PaginatedBookingsResponse>({
    queryKey: ['bookings', activeTab, page, limit, user?.id],
    queryFn: async () => {
      const statusParam = activeTab && activeTab !== 'all' ? `status=${activeTab}&` : '';
      const res = await apiRequest(`/admin/bookings?${statusParam}page=${page}&limit=${limit}`);

      let items: Booking[] = [];
      let pagination = { total: 0, page, limit, totalPages: 1, hasMore: false };

      if (res?.data?.items && Array.isArray(res.data.items)) {
        items = res.data.items;
        pagination = res.data.pagination || pagination;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
        pagination = {
          total: items.length,
          page: 1,
          limit: items.length || limit,
          totalPages: 1,
          hasMore: false,
        };
      } else if (Array.isArray(res)) {
        items = res;
        pagination = {
          total: items.length,
          page: 1,
          limit: items.length || limit,
          totalPages: 1,
          hasMore: false,
        };
      }

      return { items, pagination };
    },
    enabled: !!user,
    retry: 2,
    staleTime: 5_000,
  });

  const bookings = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1, hasMore: false };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter((b) => {
    if (!b) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const idStr = String(b._id || b.id || '').toLowerCase();
    const cName = String(
      b.customerName ||
      (typeof b.customerId === 'object' ? b.customerId?.name : '') ||
      b.customer?.fullName ||
      b.customer?.name ||
      ''
    ).toLowerCase();
    const pName = String(
      b.providerName ||
      (typeof b.providerId === 'object' ? b.providerId?.name || b.providerId?.shopName : '') ||
      b.provider?.fullName ||
      b.provider?.name ||
      ''
    ).toLowerCase();
    const sTitle = String(
      b.serviceTitle ||
      b.serviceName ||
      b.service?.title ||
      b.service?.name ||
      ''
    ).toLowerCase();

    return (
      idStr.includes(q) ||
      cName.includes(q) ||
      pName.includes(q) ||
      sTitle.includes(q)
    );
  });

  const renderStatusBadge = (status?: string) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'completed':
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'in_progress':
      case 'accepted':
        return (
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px] gap-1">
            <Clock className="h-3 w-3" /> {s === 'in_progress' ? 'In Progress' : 'Accepted'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] gap-1">
            <AlertCircle className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'cancelled':
      case 'no_show':
        return (
          <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px] gap-1">
            <XCircle className="h-3 w-3" /> {s === 'no_show' ? 'No-Show' : 'Cancelled'}
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Global Bookings Explorer</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Inspect all service reservations, filter by booking status, and monitor transaction progress
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-center justify-between">
            <span>{(error as any).message || 'Failed to load bookings'}</span>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20">
              Retry
            </Button>
          </div>
        )}

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
            <TabsList className="bg-zinc-900 border border-zinc-800 text-zinc-400">
              <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs">
                Pending
              </TabsTrigger>
              <TabsTrigger value="accepted" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-indigo-400 text-xs">
                Accepted
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 text-xs">
                Completed
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-red-400 text-xs">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur overflow-hidden">
          <CardHeader className="py-4 border-b border-zinc-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Bookings Registry ({filteredBookings.length} of {pagination.total})
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Show:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || isAuthLoading ? (
              <div className="p-12 text-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs">Fetching bookings data...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No bookings found for the selected status or query.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-zinc-950/50 border-b border-zinc-800">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-zinc-400">ID / Service</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Provider</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400 text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b, idx) => {
                    const bookingId = String(b._id || b.id || `booking-${idx}`);
                    const cName = b.customerName || b.customerId?.name || b.customer?.fullName || b.customer?.name || 'Customer';
                    const pName = b.providerName || b.providerId?.name || b.providerId?.shopName || b.provider?.fullName || b.provider?.name || 'Provider';
                    const sTitle = b.serviceTitle || b.serviceName || b.service?.title || b.service?.name || 'Service Booking';
                    const amt = b.price || b.service?.price || 0;

                    return (
                      <TableRow key={bookingId} className="border-zinc-800/60 hover:bg-zinc-800/30">
                        <TableCell className="py-3">
                          <p className="font-semibold text-zinc-100 text-xs">{sTitle}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">#{bookingId.substring(0, 10)}...</p>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs py-3">{cName}</TableCell>
                        <TableCell className="text-zinc-300 text-xs py-3">{pName}</TableCell>
                        <TableCell className="text-teal-400 font-semibold text-xs py-3">
                          ${amt.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3">{renderStatusBadge(b.status)}</TableCell>
                        <TableCell className="text-right py-3">
                          <Button
                            onClick={() => setSelectedBooking(b)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-7 w-7 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination Controls Bar */}
          <CardFooter className="py-3 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
            <p className="text-xs text-zinc-400">
              Page <span className="font-semibold text-zinc-200">{pagination.page}</span> of{' '}
              <span className="font-semibold text-zinc-200">{pagination.totalPages}</span> (Total {pagination.total} records)
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Booking Details Modal */}
        <Dialog open={Boolean(selectedBooking)} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-100">Booking Details</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Reference ID: <span className="font-mono text-indigo-400">{selectedBooking?._id || selectedBooking?.id}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-4 py-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Service</span>
                    <p className="font-semibold text-zinc-100 mt-0.5">
                      {selectedBooking.serviceTitle || selectedBooking.serviceName || selectedBooking.service?.title || 'Standard Service'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Total Price</span>
                    <p className="font-bold text-teal-400 mt-0.5">
                      ${(selectedBooking.price || selectedBooking.service?.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Customer</span>
                    <p className="font-semibold text-zinc-200 mt-1">
                      {selectedBooking.customerName || selectedBooking.customerId?.name || selectedBooking.customer?.fullName || 'N/A'}
                    </p>
                    <p className="text-zinc-500 text-[11px]">{selectedBooking.customerId?.email || selectedBooking.customer?.email}</p>
                    {selectedBooking.customerId?.phone && <p className="text-zinc-500 text-[11px]">{selectedBooking.customerId.phone}</p>}
                  </div>
                  <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Provider</span>
                    <p className="font-semibold text-zinc-200 mt-1">
                      {selectedBooking.providerName || selectedBooking.providerId?.name || selectedBooking.providerId?.shopName || selectedBooking.provider?.fullName || 'N/A'}
                    </p>
                    <p className="text-zinc-500 text-[11px]">{selectedBooking.providerId?.shopName || selectedBooking.providerId?.address}</p>
                    {selectedBooking.providerId?.phone && <p className="text-zinc-500 text-[11px]">{selectedBooking.providerId.phone}</p>}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-400">Current Status</span>
                  <div>{renderStatusBadge(selectedBooking.status)}</div>
                </div>

                {selectedBooking.notes && (
                  <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Customer Note</span>
                    <p className="text-zinc-300 italic mt-1 text-[11px]">"{selectedBooking.notes}"</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
