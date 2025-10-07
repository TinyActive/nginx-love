import { z } from 'zod';

/**
 * Enable 2FA request validation schema
 */
export const enable2FASchema = z.object({
  token: z
    .string()
    .length(6, '2FA token must be 6 digits')
    .nonempty('2FA token is required'),
});

export type Enable2FADto = z.infer<typeof enable2FASchema>;
