import { body, param, query } from 'express-validator';
import { isValidIpOrCidr } from '../../acl/utils/validators';

/**
 * Validation rules for creating an access list
 */
export const createAccessListValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Name can only contain letters, numbers, underscores, and hyphens'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['ip_whitelist', 'http_basic_auth', 'combined'])
    .withMessage('Type must be one of: ip_whitelist, http_basic_auth, combined'),
  
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  
  body('allowedIps')
    .optional()
    .isArray()
    .withMessage('Allowed IPs must be an array'),
  
  body('allowedIps.*')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      if (!isValidIpOrCidr(value)) {
        throw new Error('Invalid IP address or CIDR notation. Examples: 192.168.1.1 or 192.168.1.0/24');
      }
      return true;
    }),
  
  body('authUsers')
    .optional()
    .isArray()
    .withMessage('Auth users must be an array'),
  
  body('authUsers.*.username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('authUsers.*.password')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters'),
  
  body('authUsers.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  
  body('domainIds')
    .optional()
    .isArray()
    .withMessage('Domain IDs must be an array'),
  
  body('domainIds.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Domain ID cannot be empty'),
];

/**
 * Validation rules for updating an access list
 */
export const updateAccessListValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Access list ID is required'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Name can only contain letters, numbers, underscores, and hyphens'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('type')
    .optional()
    .isIn(['ip_whitelist', 'http_basic_auth', 'combined'])
    .withMessage('Type must be one of: ip_whitelist, http_basic_auth, combined'),
  
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  
  body('allowedIps')
    .optional()
    .isArray()
    .withMessage('Allowed IPs must be an array'),
  
  body('allowedIps.*')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      if (!isValidIpOrCidr(value)) {
        throw new Error('Invalid IP address or CIDR notation. Examples: 192.168.1.1 or 192.168.1.0/24');
      }
      return true;
    }),
  
  body('authUsers')
    .optional()
    .isArray()
    .withMessage('Auth users must be an array'),
  
  body('authUsers.*.username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('authUsers.*.password')
    .optional({ checkFalsy: true }) // Allow empty string - means keep existing password
    .trim()
    .custom((value) => {
      // If password is provided (not empty), validate it
      if (value && value.length > 0 && value.length < 4) {
        throw new Error('Password must be at least 4 characters');
      }
      return true;
    }),
  
  body('authUsers.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  
  body('domainIds')
    .optional()
    .isArray()
    .withMessage('Domain IDs must be an array'),
  
  body('domainIds.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Domain ID cannot be empty'),
];

/**
 * Validation rules for getting access lists
 */
export const getAccessListsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim(),
  
  query('type')
    .optional()
    .isIn(['ip_whitelist', 'http_basic_auth', 'combined'])
    .withMessage('Type must be one of: ip_whitelist, http_basic_auth, combined'),
  
  query('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

/**
 * Validation rules for getting single access list
 */
export const getAccessListValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Access list ID is required'),
];

/**
 * Validation rules for deleting access list
 */
export const deleteAccessListValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Access list ID is required'),
];

/**
 * Validation rules for applying access list to domain
 */
export const applyToDomainValidation = [
  body('accessListId')
    .trim()
    .notEmpty()
    .withMessage('Access list ID is required'),
  
  body('domainId')
    .trim()
    .notEmpty()
    .withMessage('Domain ID is required'),
  
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

/**
 * Validation rules for removing access list from domain
 */
export const removeFromDomainValidation = [
  param('accessListId')
    .trim()
    .notEmpty()
    .withMessage('Access list ID is required'),
  
  param('domainId')
    .trim()
    .notEmpty()
    .withMessage('Domain ID is required'),
];
