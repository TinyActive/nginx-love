import { body, ValidationChain } from 'express-validator';

/**
 * First login password change request DTO
 */
export interface FirstLoginPasswordDto {
  userId: string;
  tempToken: string;
  newPassword: string;
}

/**
 * First login password change validation rules
 */
export const firstLoginPasswordValidation: ValidationChain[] = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('tempToken')
    .notEmpty()
    .withMessage('Temporary token is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
];
