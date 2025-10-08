import bcrypt from 'bcrypt';
import { config } from '../config';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.security.bcryptRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a secure random password with all required character types
 * @param length - Length of password (default: 16)
 * @returns Secure password with uppercase, lowercase, numbers, and special characters
 */
export const generateSecurePassword = (length: number = 16): string => {
  // Ensure minimum length of 12 for security
  const finalLength = Math.max(length, 12);
  
  // Character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Ensure at least one character from each set
  const requiredChars = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    special[crypto.randomInt(0, special.length)],
  ];
  
  // All possible characters
  const allChars = uppercase + lowercase + numbers + special;
  
  // Generate remaining random characters
  const remainingLength = finalLength - requiredChars.length;
  const randomChars: string[] = [];
  
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = crypto.randomInt(0, allChars.length);
    randomChars.push(allChars[randomIndex]);
  }
  
  // Combine and shuffle all characters
  const allPasswordChars = [...requiredChars, ...randomChars];
  
  // Fisher-Yates shuffle algorithm for cryptographically secure shuffle
  for (let i = allPasswordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [allPasswordChars[i], allPasswordChars[j]] = [allPasswordChars[j], allPasswordChars[i]];
  }
  
  return allPasswordChars.join('');
};
