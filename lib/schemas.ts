import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Please enter a valid email or phone number'),
  password: z.string().min(4, 'Password must be at least 4 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  iconName: z.string().min(1, 'Please select a visual icon'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const bannerSchema = z.object({
  title: z.string().min(2, 'Banner title must be at least 2 characters'),
  subtitle: z.string().min(2, 'Subtitle must be at least 2 characters'),
  imageUrl: z.string().optional(),
  targetCategoryId: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  isActive: z.boolean(),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

export const settingsSchema = z.object({
  supportPhone: z.string().min(5, 'Valid support phone number is required'),
  supportEmail: z.string().email('Valid support email address is required'),
  isMaintenanceMode: z.boolean(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const rejectionSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters'),
});

export type RejectionFormData = z.infer<typeof rejectionSchema>;

