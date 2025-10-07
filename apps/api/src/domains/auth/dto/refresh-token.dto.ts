import { body, ValidationChain } from 'express-validator';

/**
 * Refresh token request DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Refresh token validation rules
 */
export const refreshTokenValidation: ValidationChain[] = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];
