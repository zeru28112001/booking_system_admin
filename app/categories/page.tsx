'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/lib/schemas';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  Scissors,
  Sparkles,
  Wrench,
  Zap,
  BookOpen,
  Car,
  Dumbbell,
  Bug,
  Palette,
  Stethoscope,
  Hammer,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface CategoryIcon {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ICON_LIST: CategoryIcon[] = [
  { id: 'content_cut', label: 'Beauty & Salon', icon: Scissors },
  { id: 'spa', label: 'Spa & Wellness', icon: Sparkles },
  { id: 'cleaning', label: 'Cleaning & Maid', icon: Wrench },
  { id: 'plumbing', label: 'Plumbing', icon: Wrench },
  { id: 'electrical', label: 'Electrical', icon: Zap },
  { id: 'tutoring', label: 'Tutoring', icon: BookOpen },
  { id: 'car', label: 'Automotive', icon: Car },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'pest', label: 'Pest Control', icon: Bug },
  { id: 'brush', label: 'Art & Design', icon: Palette },
  { id: 'medical_services', label: 'Medical', icon: Stethoscope },
  { id: 'home_repair_service', label: 'Home Repair', icon: Hammer },
];

export function getCategoryIcon(iconName?: string): LucideIcon {
  if (!iconName) return HelpCircle;
  const found = ICON_LIST.find((item) => item.id === iconName);
  if (found) return found.icon;

  const lower = iconName.toLowerCase();
  if (lower.includes('salon') || lower.includes('cut') || lower.includes('hair') || lower.includes('barber')) return Scissors;
  if (lower.includes('spa') || lower.includes('wellness') || lower.includes('beauty')) return Sparkles;
  if (lower.includes('clean') || lower.includes('maid')) return Wrench;
  if (lower.includes('plumb') || lower.includes('leak') || lower.includes('water')) return Wrench;
  if (lower.includes('electr') || lower.includes('power') || lower.includes('zap')) return Zap;
  if (lower.includes('tutor') || lower.includes('book') || lower.includes('teach') || lower.includes('education')) return BookOpen;
  if (lower.includes('car') || lower.includes('auto') || lower.includes('vehicle')) return Car;
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('train')) return Dumbbell;
  if (lower.includes('pest') || lower.includes('bug')) return Bug;
  if (lower.includes('art') || lower.includes('paint') || lower.includes('brush') || lower.includes('design')) return Palette;
  if (lower.includes('medic') || lower.includes('health') || lower.includes('doctor')) return Stethoscope;
  if (lower.includes('repair') || lower.includes('hammer') || lower.includes('home') || lower.includes('fix')) return Hammer;

  return HelpCircle;
}

interface Category {
  _id: string;
  name: string;
  name_mm?: string;
  iconName: string;
  description?: string;
  isActive?: boolean;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  // Dialog & Delete state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { user } = useAuth();

  const {
    data: categories = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const res = await apiRequest('/admin/categories');
      const raw = res?.data || res || [];
      return Array.isArray(raw) ? raw : [];
    },
    enabled: !!user,
    retry: 2,
    staleTime: 5_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      name_mm: '',
      iconName: 'content_cut',
      description: '',
      isActive: true,
    },
  });

  const selectedIconName = watch('iconName');

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (editingCategory) {
        return apiRequest(`/admin/categories/${editingCategory._id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
      return apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return apiRequest(`/admin/categories/${categoryId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingCategory(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete category');
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({
      name: '',
      name_mm: '',
      iconName: 'content_cut',
      description: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      name_mm: cat.name_mm || '',
      iconName: cat.iconName || 'content_cut',
      description: cat.description || '',
      isActive: cat.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CategoryFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Category Management</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Create and manage service categories with graphical icon selection
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" /> Add New Category
            </Button>
          </div>
        </div>

        {/* Category Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
            No service categories found. Click "Add New Category" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComp = getCategoryIcon(cat.iconName);
              return (
                <Card key={cat._id} className="bg-zinc-900/60 border-zinc-800 backdrop-blur flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          cat.isActive ?? true
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]'
                            : 'border-zinc-700 text-zinc-500 bg-zinc-800 text-[10px]'
                        }
                      >
                        {cat.isActive ?? true ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-zinc-100 mt-3">{cat.name}</CardTitle>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {cat.description || 'No description provided.'}
                    </p>
                  </CardHeader>
                  <CardFooter className="pt-2 pb-4 border-t border-zinc-800/80 flex justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">Icon: {cat.iconName}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleOpenEdit(cat)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => setDeletingCategory(cat)}
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

        {/* Add/Edit Category Modal with Visual Icon Picker */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-100">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Choose a visual icon and define category attributes
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="catName" className="text-xs font-semibold text-zinc-300">
                    Category Name (English)
                  </Label>
                  <Input
                    id="catName"
                    placeholder="e.g. Hair Cut & Barber"
                    {...register('name')}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="catNameMm" className="text-xs font-semibold text-zinc-300">
                    Category Name (Myanmar)
                  </Label>
                  <Input
                    id="catNameMm"
                    placeholder="ဥပမာ- ဆံပင်ညှပ်နှင့် ဆလုန်း"
                    {...register('name_mm')}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Visual Icon Picker Grid */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Select Visual Icon
                </Label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-950/80 rounded-lg border border-zinc-800">
                  {ICON_LIST.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedIconName === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setValue('iconName', item.id)}
                        className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all text-center ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/30'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-[10px] font-medium leading-none truncate w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.iconName && (
                  <p className="text-xs text-red-400">{errors.iconName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catDesc" className="text-xs font-semibold text-zinc-300">
                  Description
                </Label>
                <Input
                  id="catDesc"
                  placeholder="Brief summary of services in this category..."
                  {...register('description')}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs focus-visible:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="catActive" className="text-xs font-semibold text-zinc-200">
                    Active Status
                  </Label>
                  <p className="text-[11px] text-zinc-400">Make this category visible on customer side</p>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="catActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
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
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal using ConfirmDialog */}
        <ConfirmDialog
          open={Boolean(deletingCategory)}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
          title="Delete Category"
          description={
            <span>
              Are you sure you want to delete category{' '}
              <strong className="text-zinc-200">{deletingCategory?.name}</strong>? This action cannot be undone.
            </span>
          }
          confirmText="Delete Category"
          variant="destructive"
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            if (deletingCategory) deleteMutation.mutate(deletingCategory._id);
          }}
        />
      </div>
    </AdminLayout>
  );
}

