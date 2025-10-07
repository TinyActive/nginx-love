import { z } from 'zod';

/**
 * Update profile request validation schema
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),
  timezone: z
    .string()
    .trim()
    .optional(),
  language: z
    .enum(['en', 'vi'])
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
