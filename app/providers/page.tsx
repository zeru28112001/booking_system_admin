'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rejectionSchema, RejectionFormData } from '@/lib/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Search, CheckCircle2, XCircle, ShieldAlert, RefreshCw, UserCheck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Provider {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  shopName?: string;
  address?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | string;
  rejectionReason?: string;
  createdAt?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export default function ProvidersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog state for Verify & Reject
  const [verifyProvider, setVerifyProvider] = useState<Provider | null>(null);
  const [rejectProvider, setRejectProvider] = useState<Provider | null>(null);

  const { user, isLoading: isAuthLoading } = useAuth();

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setPage(1);
  };

  const {
    data: queryResult = { items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasMore: false } },
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery<{ items: Provider[]; pagination: PaginationMeta }>({
    queryKey: ['providers', activeTab, page, limit, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab && activeTab !== 'all') params.append('status', activeTab);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await apiRequest(`/admin/providers?${params.toString()}`);
      const raw = res?.data || res || {};

      if (Array.isArray(raw)) {
        return {
          items: raw,
          pagination: { total: raw.length, page: 1, limit: raw.length || 10, totalPages: 1, hasMore: false },
        };
      }

      const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw) ? raw : [];
      const pagination = raw.pagination || {
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit) || 1,
        hasMore: false,
      };

      return { items, pagination };
    },
    enabled: !!user,
    retry: 2,
    staleTime: 5_000,
  });

  const providers = queryResult.items;
  const pagination = queryResult.pagination;

  const verifyMutation = useMutation({
    mutationFn: async (providerId: string) => {
      return apiRequest(`/admin/providers/${providerId}/verify`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast.success('Provider verified successfully!');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setVerifyProvider(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Verification failed');
    },
  });

  const rejectForm = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: '' },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ providerId, reason }: { providerId: string; reason: string }) => {
      return apiRequest(`/admin/providers/${providerId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast.success('Provider verification rejected');
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setRejectProvider(null);
      rejectForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    },
  });

  const handleOpenReject = (provider: Provider) => {
    setRejectProvider(provider);
    rejectForm.reset({ reason: '' });
  };

  const filteredProviders = (Array.isArray(providers) ? providers : []).filter((p) => {
    if (!p) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const pName = String(
      p.name ||
      p.shopName ||
      p.fullName ||
      (typeof p.userId === 'object' ? p.userId?.name : '') ||
      ''
    ).toLowerCase();
    const pEmail = String(
      p.email ||
      (typeof p.userId === 'object' ? p.userId?.email : '') ||
      ''
    ).toLowerCase();
    const pPhone = String(
      p.phone ||
      (typeof p.userId === 'object' ? p.userId?.phone : '') ||
      ''
    ).toLowerCase();
    const bName = String(p.shopName || p.businessName || p.address || '').toLowerCase();

    return (
      pName.includes(q) ||
      pEmail.includes(q) ||
      pPhone.includes(q) ||
      bName.includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Provider Management</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Verify service provider applications, review business credentials, and manage accounts
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

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-center justify-between">
            <span>{(error as any).message || 'Failed to load service providers'}</span>
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
                Pending Verification
              </TabsTrigger>
              <TabsTrigger value="verified" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 text-xs">
                Verified
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-red-400 text-xs">
                Rejected
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table View */}
        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur overflow-hidden">
          <CardHeader className="py-4 border-b border-zinc-800/80">
            <CardTitle className="text-sm font-semibold text-zinc-200">
              Service Providers Directory (Total: {pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading || isAuthLoading ? (
              <div className="p-12 text-center text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs">Loading provider accounts...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No providers match the selected status or query.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-zinc-950/50 border-b border-zinc-800">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-zinc-400">Provider Name</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Business / Shop</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider, idx) => {
                    const provId = String(provider._id || provider.id || `provider-${idx}`);
                    const displayName = provider.name || provider.shopName || provider.fullName || provider.userId?.name || 'Service Provider';
                    const displayBusiness = provider.shopName || provider.businessName || 'Independent Shop';
                    const displayEmail = provider.email || provider.userId?.email || 'No email';
                    const displayPhone = provider.phone || provider.userId?.phone;

                    return (
                      <TableRow key={provId} className="border-zinc-800/60 hover:bg-zinc-800/30">
                        <TableCell className="font-medium text-zinc-100 text-xs py-3">
                          {displayName}
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs py-3">
                          {displayBusiness}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs py-3 space-y-0.5">
                          <p>{displayEmail}</p>
                          {displayPhone && <p className="text-[11px] text-zinc-500">{displayPhone}</p>}
                        </TableCell>
                        <TableCell className="py-3">
                          {provider.verificationStatus === 'verified' && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          )}
                          {provider.verificationStatus === 'pending' && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] gap-1">
                              <ShieldAlert className="h-3 w-3" /> Pending Review
                            </Badge>
                          )}
                          {provider.verificationStatus === 'rejected' && (
                            <div className="space-y-1">
                              <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Rejected
                              </Badge>
                              {provider.rejectionReason && (
                                <p className="text-[10px] text-red-400/80 italic max-w-xs truncate">
                                  "{provider.rejectionReason}"
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-2">
                            {provider.verificationStatus !== 'verified' && (
                              <Button
                                onClick={() => setVerifyProvider(provider)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                Verify
                              </Button>
                            )}
                            {provider.verificationStatus !== 'rejected' && (
                              <Button
                                onClick={() => handleOpenReject(provider)}
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7 px-2.5"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls Bar */}
            <div className="px-4 py-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-zinc-500">
                  Showing {providers.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, pagination.total)} of {pagination.total}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                    className="h-7 w-7 p-0 border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                    disabled={page >= pagination.totalPages || isLoading}
                    className="h-7 w-7 p-0 border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Confirm Modal */}
        <ConfirmDialog
          open={!!verifyProvider}
          onOpenChange={(open) => !open && setVerifyProvider(null)}
          title="Verify Provider Account"
          description={
            <span>
              Are you sure you want to verify standard credentials for{' '}
              <strong className="text-zinc-200">
                {verifyProvider?.name || verifyProvider?.shopName || verifyProvider?.fullName || verifyProvider?.userId?.name}
              </strong>
              ? This will grant full platform listing access.
            </span>
          }
          confirmText="Approve & Verify"
          variant="default"
          isLoading={verifyMutation.isPending}
          onConfirm={() => {
            if (verifyProvider?._id || verifyProvider?.id) {
              verifyMutation.mutate(verifyProvider._id || verifyProvider.id!);
            }
          }}
        />

        {/* Rejection Confirm Dialog with Zod Form */}
        <ConfirmDialog
          open={!!rejectProvider}
          onOpenChange={(open) => !open && setRejectProvider(null)}
          title="Reject Provider Verification"
          description={
            <div className="space-y-3 pt-2">
              <p className="text-xs text-zinc-400">
                Please provide a clear reason for rejecting{' '}
                <strong className="text-zinc-200">
                  {rejectProvider?.name || rejectProvider?.shopName || rejectProvider?.fullName || rejectProvider?.userId?.name}
                </strong>
                .
              </p>
              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs font-semibold text-zinc-300">
                  Rejection Reason
                </Label>
                <Input
                  id="reason"
                  placeholder="e.g., Incomplete identity documents or invalid business license."
                  {...rejectForm.register('reason')}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-red-500"
                />
                {rejectForm.formState.errors.reason && (
                  <p className="text-xs text-red-400">
                    {rejectForm.formState.errors.reason.message}
                  </p>
                )}
              </div>
            </div>
          }
          confirmText="Confirm Rejection"
          variant="destructive"
          isLoading={rejectMutation.isPending}
          onConfirm={rejectForm.handleSubmit((data) => {
            if (rejectProvider?._id || rejectProvider?.id) {
              rejectMutation.mutate({ providerId: rejectProvider._id || rejectProvider.id!, reason: data.reason });
            }
          })}
        />
      </div>
    </AdminLayout>
  );
}
