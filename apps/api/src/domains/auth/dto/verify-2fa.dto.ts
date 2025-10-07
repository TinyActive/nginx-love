import { body, ValidationChain } from 'express-validator';

/**
 * Verify 2FA request DTO
 */
export interface Verify2FADto {
  userId: string;
  token: string;
}

/**
 * Verify 2FA validation rules
 */
export const verify2FAValidation: ValidationChain[] = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('token')
    .notEmpty()
    .withMessage('2FA token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA token must be 6 digits'),
];
