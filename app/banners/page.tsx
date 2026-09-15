'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bannerSchema, BannerFormData } from '@/lib/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, RefreshCw, Loader2, Image as ImageIcon, ArrowUpDown, Tag } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  iconName?: string;
  imageUrl?: string;
  targetCategoryId?: string | { _id?: string; id?: string; name?: string };
  isActive?: boolean;
  sortOrder?: number;
}

export default function BannersPage() {
  const queryClient = useQueryClient();

  // Dialog & Delete state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

  const {
    data: banners = [],
    isLoading: isBannersLoading,
    isRefetching: isBannersRefetching,
    refetch: refetchBanners,
  } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await apiRequest('/admin/banners');
      return res.data || [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiRequest('/admin/categories');
      return res.data || [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      imageUrl: '',
      targetCategoryId: 'none',
      sortOrder: 0,
      isActive: true,
    },
  });

  const currentSortOrder = watch('sortOrder') ?? 0;

  const saveMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      const bodyData = {
        title: data.title.trim(),
        subtitle: data.subtitle.trim(),
        imageUrl: data.imageUrl?.trim() || undefined,
        targetCategoryId: data.targetCategoryId === 'none' || !data.targetCategoryId ? undefined : data.targetCategoryId,
        sortOrder: Number(data.sortOrder),
        isActive: data.isActive,
      };

      if (editingBanner) {
        return apiRequest(`/admin/banners/${editingBanner._id}`, {
          method: 'PUT',
          body: JSON.stringify(bodyData),
        });
      }
      return apiRequest('/admin/banners', {
        method: 'POST',
        body: JSON.stringify(bodyData),
      });
    },
    onSuccess: () => {
      toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setIsDialogOpen(false);
      setEditingBanner(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      return apiRequest(`/admin/banners/${bannerId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Banner deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setDeletingBanner(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete banner');
    },
  });

  const handleOpenCreate = () => {
    setEditingBanner(null);
    reset({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetCategoryId: 'none',
      sortOrder: 0,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingBanner(b);
    const catId = typeof b.targetCategoryId === 'object' && b.targetCategoryId !== null
      ? (b.targetCategoryId as any)._id || (b.targetCategoryId as any).id
      : b.targetCategoryId;

    reset({
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl || '',
      targetCategoryId: catId || 'none',
      sortOrder: b.sortOrder ?? 0,
      isActive: b.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: BannerFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Promo Banner Management</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Configure home screen promotional sliders, image banners, and category redirects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetchBanners()}
              disabled={isBannersLoading || isBannersRefetching}
              variant="outline"
              size="sm"
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isBannersLoading || isBannersRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" /> Add Promo Banner
            </Button>
          </div>
        </div>

        {/* Banners Grid */}
        {isBannersLoading ? (
          <div className="p-12 text-center text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading promo banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
            No promo banners available. Click "Add Promo Banner" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b) => {
              const categoryName = typeof b.targetCategoryId === 'object' && b.targetCategoryId !== null
                ? (b.targetCategoryId as any).name
                : categories.find((c) => c._id === b.targetCategoryId)?.name;

              return (
                <Card key={b._id} className="bg-zinc-900/60 border-zinc-800 backdrop-blur overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Banner Image Preview */}
                    <div className="relative h-40 w-full bg-zinc-950 border-b border-zinc-800 flex items-center justify-center overflow-hidden">
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-600">
                          <ImageIcon className="h-8 w-8" />
                          <span className="text-[10px]">No Banner Image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={
                            b.isActive ?? true
                              ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/80 backdrop-blur text-[10px]'
                              : 'border-zinc-700 text-zinc-400 bg-zinc-950/80 backdrop-blur text-[10px]'
                          }
                        >
                          {b.isActive ?? true ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                        <span className="inline-flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          <ArrowUpDown className="h-3 w-3" /> Priority #{b.sortOrder ?? 0}
                        </span>
                        {categoryName && (
                          <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded text-[10px]">
                            <Tag className="h-3 w-3 text-indigo-400" /> {categoryName}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base font-bold text-zinc-100 pt-1">{b.title}</CardTitle>
                      <p className="text-xs text-zinc-400">{b.subtitle}</p>
                    </CardHeader>
                  </div>

                  <CardFooter className="pt-2 pb-4 border-t border-zinc-800/80 flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">
                      ID: {b._id.substring(0, 10)}...
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleOpenEdit(b)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => setDeletingBanner(b)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-100">
                {editingBanner ? 'Edit Promo Banner' : 'Add New Promo Banner'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Configure banner title, subtitle, image link, priority order, and category redirect
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="bannerTitle" className="text-xs font-semibold text-zinc-300">
                  Banner Title
                </Label>
                <Input
                  id="bannerTitle"
                  placeholder="e.g., 20% OFF Summer Spa Special"
                  {...register('title')}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                />
                {errors.title && (
                  <p className="text-xs text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bannerSub" className="text-xs font-semibold text-zinc-300">
                  Subtitle / Promo Text
                </Label>
                <Input
                  id="bannerSub"
                  placeholder="e.g., Book today and get premium relaxation services."
                  {...register('subtitle')}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                />
                {errors.subtitle && (
                  <p className="text-xs text-red-400">{errors.subtitle.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bannerImg" className="text-xs font-semibold text-zinc-300">
                  Image URL (Optional)
                </Label>
                <Input
                  id="bannerImg"
                  placeholder="https://images.unsplash.com/photo-..."
                  {...register('imageUrl')}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                />
              </div>

              {/* Target Category Redirect */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-300">Target Category Redirect</Label>
                  <span className="text-[10px] text-zinc-500">Optional tap redirection</span>
                </div>
                <Controller
                  name="targetCategoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || 'none'} onValueChange={(val) => field.onChange(val || 'none')}>
                      <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-9">
                        <SelectValue placeholder="Select Target Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        <SelectItem value="none">None (General Promotional Banner)</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Slider Priority (Sort Order) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sortOrder" className="text-xs font-semibold text-zinc-300">
                    Slider Priority (Sort Order)
                  </Label>
                  <span className="text-[10px] text-zinc-500">Lower numbers appear first</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('sortOrder', Math.max(0, currentSortOrder - 1))}
                    className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 text-xs shrink-0"
                  >
                    -
                  </Button>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    {...register('sortOrder', { valueAsNumber: true })}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs text-center focus-visible:ring-indigo-500 h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('sortOrder', currentSortOrder + 1)}
                    className="h-9 w-9 border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-zinc-100 text-xs shrink-0"
                  >
                    +
                  </Button>
                </div>
                {errors.sortOrder && (
                  <p className="text-xs text-red-400">{errors.sortOrder.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="bannerActive" className="text-xs font-semibold text-zinc-200">
                    Active Status
                  </Label>
                  <p className="text-[11px] text-zinc-400">Display this promo on customer home screen</p>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch id="bannerActive" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal using ConfirmDialog */}
        <ConfirmDialog
          open={Boolean(deletingBanner)}
          onOpenChange={(open) => !open && setDeletingBanner(null)}
          title="Delete Promo Banner"
          description={
            <span>
              Are you sure you want to delete promo banner{' '}
              <strong className="text-zinc-200">{deletingBanner?.title}</strong>? This action cannot be undone.
            </span>
          }
          confirmText="Delete Banner"
          variant="destructive"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (deletingBanner) deleteMutation.mutate(deletingBanner._id);
          }}
        />
      </div>
    </AdminLayout>
  );
}

