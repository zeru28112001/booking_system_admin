'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rejectionSchema, RejectionFormData } from '@/lib/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { RefreshCw, Loader2, Check, X, FileText, ArrowRight } from 'lucide-react';

interface ProfileRequest {
  _id: string;
  providerId: string;
  providerName?: string;
  providerEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedChanges: Record<string, any>;
  currentValues?: Record<string, any>;
  createdAt?: string;
}

export default function ProfileRequestsPage() {
  const queryClient = useQueryClient();

  // Approve and Reject modal states
  const [approveRequest, setApproveRequest] = useState<ProfileRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<ProfileRequest | null>(null);

  const {
    data: requests = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<ProfileRequest[]>({
    queryKey: ['profile-requests'],
    queryFn: async () => {
      const res = await apiRequest('/admin/profile-requests');
      return res.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/admin/profile-requests/${id}/approve`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast.success('Profile change request approved!');
      queryClient.invalidateQueries({ queryKey: ['profile-requests'] });
      setApproveRequest(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Approval failed');
    },
  });

  const rejectForm = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: { reason: '' },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest(`/admin/profile-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast.success('Profile change request rejected');
      queryClient.invalidateQueries({ queryKey: ['profile-requests'] });
      setRejectRequest(null);
      rejectForm.reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Rejection failed');
    },
  });

  const handleOpenReject = (req: ProfileRequest) => {
    setRejectRequest(req);
    rejectForm.reset({ reason: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Profile Change Requests</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Review and verify provider account modifications (business name, bio, phone, services)
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

        {/* Content list */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading pending profile update requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
            No pending profile change requests require review.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req._id} className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
                <CardHeader className="py-4 border-b border-zinc-800/80 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-zinc-100">
                        {req.providerName || 'Provider Request'}
                      </CardTitle>
                      <p className="text-xs text-zinc-400">{req.providerEmail || req.providerId}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">
                    Pending Approval
                  </Badge>
                </CardHeader>

                <CardContent className="py-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-300">Requested Field Changes:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(req.requestedChanges || {}).map(([key, value]) => (
                      <div key={key} className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800 text-xs">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">{key}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-zinc-400 line-through text-[11px]">
                            {req.currentValues?.[key] ? String(req.currentValues[key]) : 'None'}
                          </span>
                          <ArrowRight className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="text-indigo-300 font-semibold">{String(value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="py-3 border-t border-zinc-800/80 flex justify-between items-center bg-zinc-950/30">
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {req._id}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setApproveRequest(req)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve Changes
                    </Button>
                    <Button
                      onClick={() => handleOpenReject(req)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Approve Confirmation Modal */}
        <ConfirmDialog
          open={Boolean(approveRequest)}
          onOpenChange={(open) => !open && setApproveRequest(null)}
          title="Approve Profile Changes"
          description={
            <span>
              Are you sure you want to approve profile changes for{' '}
              <strong className="text-zinc-200">{approveRequest?.providerName || 'this provider'}</strong>? The changes will be applied directly to their active profile.
            </span>
          }
          confirmText="Approve & Apply"
          variant="default"
          isLoading={approveMutation.isPending}
          onConfirm={() => {
            if (approveRequest) approveMutation.mutate(approveRequest._id);
          }}
        />

        {/* Rejection Modal with Zod Form */}
        <ConfirmDialog
          open={Boolean(rejectRequest)}
          onOpenChange={(open) => !open && setRejectRequest(null)}
          title="Reject Profile Request"
          description={
            <div className="space-y-3 pt-2">
              <p className="text-xs text-zinc-400">
                Please provide a rejection reason for{' '}
                <strong className="text-zinc-200">{rejectRequest?.providerName}</strong>.
              </p>
              <div className="space-y-1">
                <Label htmlFor="reqReason" className="text-xs font-semibold text-zinc-300">
                  Reason for Rejection
                </Label>
                <Input
                  id="reqReason"
                  placeholder="e.g. Invalid business name or unverified telephone."
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
            if (rejectRequest) {
              rejectMutation.mutate({ id: rejectRequest._id, reason: data.reason });
            }
          })}
        />
      </div>
    </AdminLayout>
  );
}

