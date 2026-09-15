'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/api';
import { Search, RefreshCw, Loader2, Eye, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Booking {
  _id: string;
  customerName?: string;
  providerName?: string;
  serviceTitle?: string;
  price?: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  date?: string;
  notes?: string;
  createdAt?: string;
  customer?: { fullName?: string; email?: string };
  provider?: { fullName?: string; businessName?: string };
  service?: { title?: string; price?: number };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const {
    data: bookings = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ['bookings', activeTab],
    queryFn: async () => {
      const queryParam = activeTab && activeTab !== 'all' ? `?status=${activeTab}` : '';
      const res = await apiRequest(`/admin/bookings${queryParam}`);
      return res.data || [];
    },
  });

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const cName = b.customerName || b.customer?.fullName || '';
    const pName = b.providerName || b.provider?.fullName || '';
    const sTitle = b.serviceTitle || b.service?.title || '';

    return (
      b._id.toLowerCase().includes(q) ||
      cName.toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q) ||
      sTitle.toLowerCase().includes(q)
    );
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px] gap-1">
            <Clock className="h-3 w-3" /> Accepted
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] gap-1">
            <AlertCircle className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px] gap-1">
            <XCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
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
            Refresh
          </Button>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
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
          <CardHeader className="py-4 border-b border-zinc-800/80">
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Bookings Registry ({filteredBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
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
                  {filteredBookings.map((b) => {
                    const cName = b.customerName || b.customer?.fullName || 'Customer';
                    const pName = b.providerName || b.provider?.fullName || 'Provider';
                    const sTitle = b.serviceTitle || b.service?.title || 'Service Booking';
                    const amt = b.price || b.service?.price || 0;

                    return (
                      <TableRow key={b._id} className="border-zinc-800/60 hover:bg-zinc-800/30">
                        <TableCell className="py-3">
                          <p className="font-semibold text-zinc-100 text-xs">{sTitle}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">#{b._id.substring(0, 10)}...</p>
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
        </Card>

        {/* Booking Details Modal */}
        <Dialog open={Boolean(selectedBooking)} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-100">Booking Details</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Reference ID: <span className="font-mono text-indigo-400">{selectedBooking?._id}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-4 py-3 text-xs">
                <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Service</span>
                    <p className="font-semibold text-zinc-100 mt-0.5">
                      {selectedBooking.serviceTitle || selectedBooking.service?.title || 'Standard Service'}
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
                      {selectedBooking.customerName || selectedBooking.customer?.fullName || 'N/A'}
                    </p>
                    <p className="text-zinc-500 text-[11px]">{selectedBooking.customer?.email}</p>
                  </div>
                  <div className="p-3 bg-zinc-950/40 rounded-lg border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Provider</span>
                    <p className="font-semibold text-zinc-200 mt-1">
                      {selectedBooking.providerName || selectedBooking.provider?.fullName || 'N/A'}
                    </p>
                    <p className="text-zinc-500 text-[11px]">{selectedBooking.provider?.businessName}</p>
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

