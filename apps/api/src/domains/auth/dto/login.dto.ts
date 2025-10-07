import { body, ValidationChain } from 'express-validator';

/**
 * Login request DTO
 */
export interface LoginDto {
  username: string;
  password: string;
}

/**
 * Login validation rules
 */
export const loginValidation: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];
