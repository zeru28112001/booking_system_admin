'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, SettingsFormData } from '@/lib/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, ShieldAlert, Phone, Mail, Save, Loader2, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<SettingsFormData | null>(null);

  const {
    data: settingsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<SettingsFormData>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiRequest('/admin/settings');
      return {
        supportPhone: res.data?.supportPhone || '',
        supportEmail: res.data?.supportEmail || '',
        isMaintenanceMode: Boolean(res.data?.isMaintenanceMode),
      };
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      supportPhone: '',
      supportEmail: '',
      isMaintenanceMode: false,
    },
  });

  useEffect(() => {
    if (settingsData) {
      reset(settingsData);
    }
  }, [settingsData, reset]);

  const isMaintenanceMode = watch('isMaintenanceMode');

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const bodyData = {
        isMaintenanceMode: data.isMaintenanceMode,
        supportPhone: data.supportPhone.trim(),
        supportEmail: data.supportEmail.trim(),
      };
      return apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(bodyData),
      });
    },
    onSuccess: () => {
      toast.success('System settings saved! Live socket broadcast emitted.');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setConfirmOpen(false);
      setPendingData(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update system settings');
    },
  });

  const onPreSubmit = (data: SettingsFormData) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      saveMutation.mutate(pendingData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">System Settings</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Configure global platform parameters, system maintenance mode, and support contacts
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

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading configuration parameters...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
            {/* Maintenance Mode Card */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur overflow-hidden">
              <CardHeader className="py-4 border-b border-zinc-800/80 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-zinc-100">System Maintenance Mode</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Instantly restrict access across Mobile Customer & Provider Apps
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isMaintenanceMode
                      ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] animate-pulse'
                      : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]'
                  }
                >
                  {isMaintenanceMode ? 'MAINTENANCE ACTIVE' : 'SYSTEM NORMAL'}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between p-4 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <div className="space-y-1">
                    <Label htmlFor="maintToggle" className="text-sm font-semibold text-zinc-200">
                      Enable Maintenance Mode
                    </Label>
                    <p className="text-xs text-zinc-400">
                      When turned ON, socket broadcast emits live updates to block new bookings and show emergency banners on all client apps.
                    </p>
                  </div>
                  <Controller
                    name="isMaintenanceMode"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="maintToggle"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Support Information Card */}
            <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur">
              <CardHeader className="py-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-zinc-100">Customer Support Contacts</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Contact details displayed on customer and provider help screens
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sPhone" className="text-xs font-semibold text-zinc-300">
                      Support Telephone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <Input
                        id="sPhone"
                        placeholder="+1 (800) 555-0199"
                        {...register('supportPhone')}
                        className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                      />
                    </div>
                    {errors.supportPhone && (
                      <p className="text-xs text-red-400">{errors.supportPhone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sEmail" className="text-xs font-semibold text-zinc-300">
                      Support Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <Input
                        id="sEmail"
                        type="email"
                        placeholder="support@bookingplatform.com"
                        {...register('supportEmail')}
                        className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                      />
                    </div>
                    {errors.supportEmail && (
                      <p className="text-xs text-red-400">{errors.supportEmail.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="py-4 border-t border-zinc-800/80 flex justify-end bg-zinc-950/30">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save System Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Save System Settings"
          description={
            <span>
              Are you sure you want to update platform system settings?
              {pendingData?.isMaintenanceMode !== settingsData?.isMaintenanceMode && (
                <strong className="block mt-2 text-amber-400">
                  Note: Maintenance Mode will be {pendingData?.isMaintenanceMode ? 'ENABLED' : 'DISABLED'} across all mobile applications via WebSocket broadcast.
                </strong>
              )}
            </span>
          }
          confirmText="Confirm & Broadcast"
          variant={pendingData?.isMaintenanceMode ? 'warning' : 'default'}
          isLoading={saveMutation.isPending}
          onConfirm={handleConfirmSave}
        />
      </div>
    </AdminLayout>
  );
}

