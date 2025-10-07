import { z } from 'zod';

/**
 * Change password request validation schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .nonempty('Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      )
      .nonempty('New password is required'),
    confirmPassword: z
      .string()
      .nonempty('Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
