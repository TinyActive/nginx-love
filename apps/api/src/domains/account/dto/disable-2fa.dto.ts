import { z } from 'zod';

/**
 * Disable 2FA request validation schema (currently no parameters needed)
 */
export const disable2FASchema = z.object({});

export type Disable2FADto = z.infer<typeof disable2FASchema>;
