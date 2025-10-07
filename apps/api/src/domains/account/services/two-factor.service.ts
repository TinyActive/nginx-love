import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { config } from '../../../config';

/**
 * Two-Factor Authentication Service
 * Handles all 2FA operations including secret generation, QR code creation,
 * token verification, and backup code generation
 */
export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  generate2FASecret(username: string): { secret: string; otpauth_url: string } {
    const secret = speakeasy.generateSecret({
      name: `${config.twoFactor.appName} (${username})`,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url!,
    };
  }

  /**
   * Generate QR code from OTP auth URL
   */
  async generateQRCode(otpauth_url: string): Promise<string> {
    return QRCode.toDataURL(otpauth_url);
  }

  /**
   * Verify a 2FA token against a secret
   */
  verify2FAToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps for clock skew
    });
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(count: number = 5): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code =
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
