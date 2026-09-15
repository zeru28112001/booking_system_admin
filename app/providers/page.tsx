'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Search, CheckCircle2, XCircle, ShieldAlert, RefreshCw, UserCheck, Loader2 } from 'lucide-react';

interface Provider {
  _id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  shopName?: string;
  address?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export default function ProvidersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state for Verify & Reject
  const [verifyProvider, setVerifyProvider] = useState<Provider | null>(null);
  const [rejectProvider, setRejectProvider] = useState<Provider | null>(null);

  const {
    data: providers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Provider[]>({
    queryKey: ['providers', activeTab],
    queryFn: async () => {
      const queryParam = activeTab && activeTab !== 'all' ? `?status=${activeTab}` : '';
      const res = await apiRequest(`/admin/providers${queryParam}`);
      return res.data || [];
    },
  });

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

  const filteredProviders = providers.filter((p) => {
    const q = searchQuery.toLowerCase();
    const pName = p.name || p.shopName || p.fullName || p.userId?.name || '';
    const pEmail = p.email || p.userId?.email || '';
    const pPhone = p.phone || p.userId?.phone || '';
    const bName = p.shopName || p.businessName || p.address || '';

    return (
      pName.toLowerCase().includes(q) ||
      pEmail.toLowerCase().includes(q) ||
      pPhone.toLowerCase().includes(q) ||
      bName.toLowerCase().includes(q)
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

        {/* Filters & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
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
              Service Providers Directory ({filteredProviders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
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
                  {filteredProviders.map((provider) => {
                    const displayName = provider.name || provider.shopName || provider.fullName || provider.userId?.name || 'Service Provider';
                    const displayBusiness = provider.shopName || provider.businessName || 'Independent Shop';
                    const displayEmail = provider.email || provider.userId?.email || 'No email';
                    const displayPhone = provider.phone || provider.userId?.phone;

                    return (
                      <TableRow key={provider._id} className="border-zinc-800/60 hover:bg-zinc-800/30">
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
            if (verifyProvider) verifyMutation.mutate(verifyProvider._id);
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
            if (rejectProvider) {
              rejectMutation.mutate({ providerId: rejectProvider._id, reason: data.reason });
            }
          })}
        />
      </div>
    </AdminLayout>
  );
}
