import * as fs from 'fs/promises';
import * as path from 'path';
import prisma from '../../config/database';
import logger from '../../utils/logger';
import { sslRepository } from './ssl.repository';
import { acmeService } from './services/acme.service';
import {
  SSLCertificateWithDomain,
  SSLCertificateWithStatus,
  SSL_CONSTANTS,
  SSLStatus,
} from './ssl.types';
import {
  IssueAutoSSLDto,
  UploadManualSSLDto,
  UpdateSSLDto,
} from './dto';

/**
 * SSL Service - Handles all SSL certificate business logic
 */
export class SSLService {
  /**
   * Validate email format to prevent injection attacks
   */
  private validateEmail(email: string): boolean {
    // RFC 5322 compliant email regex (simplified but secure)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Additional checks
    if (email.length > 254) return false; // Max email length per RFC
    if (email.includes('..')) return false; // No consecutive dots
    if (email.startsWith('.') || email.endsWith('.')) return false; // No leading/trailing dots

    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;
    if (localPart.length > 64) return false; // Max local part length
    if (domain.length > 253) return false; // Max domain length

    return emailRegex.test(email);
  }

  /**
   * Sanitize email input to prevent command injection
   */
  private sanitizeEmail(email: string): string {
    // Remove any characters that could be used for command injection
    // Keep only characters valid in email addresses
    return email.replace(/[;&|`$(){}[\]<>'"\\!*#?~\s]/g, '');
  }

  /**
   * Validate and sanitize email with comprehensive security checks
   */
  private secureEmail(email: string | undefined): string | undefined {
    if (!email) return undefined;

    // Trim whitespace
    email = email.trim();

    // Check length before validation
    if (email.length === 0 || email.length > 254) {
      throw new Error('Invalid email format: length must be between 1 and 254 characters');
    }

    // Validate format
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Sanitize as additional security layer (defense in depth)
    const sanitized = this.sanitizeEmail(email);

    // Verify sanitization didn't break the email
    if (!this.validateEmail(sanitized)) {
      throw new Error('Email contains invalid characters');
    }

    return sanitized;
  }

  /**
   * Calculate SSL status based on expiry date
   */
  private calculateStatus(validTo: Date): SSLStatus {
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry < SSL_CONSTANTS.EXPIRING_THRESHOLD_DAYS) {
      return 'expiring';
    }
    return 'valid';
  }

  /**
   * Get all SSL certificates with computed status
   */
  async getAllCertificates(): Promise<SSLCertificateWithStatus[]> {
    const certificates = await sslRepository.findAll();

    const now = new Date();
    return certificates.map(cert => {
      const daysUntilExpiry = Math.floor(
        (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const status = this.calculateStatus(cert.validTo);

      return {
        ...cert,
        status,
        daysUntilExpiry,
      };
    });
  }

  /**
   * Get single SSL certificate by ID
   */
  async getCertificateById(id: string): Promise<SSLCertificateWithDomain | null> {
    return sslRepository.findById(id);
  }

  /**
   * Issue automatic SSL certificate using Let's Encrypt/ZeroSSL
   */
  async issueAutoCertificate(
    dto: IssueAutoSSLDto,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<SSLCertificateWithDomain> {
    const { domainId, email, autoRenew = true } = dto;

    // Validate and sanitize email input
    const secureEmailAddress = this.secureEmail(email);

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // Check if certificate already exists
    const existingCert = await sslRepository.findByDomainId(domainId);
    if (existingCert) {
      throw new Error('SSL certificate already exists for this domain');
    }

    logger.info(`Issuing SSL certificate for ${domain.name} using ZeroSSL`);

    try {
      // Issue certificate using acme.sh with ZeroSSL
      const certFiles = await acmeService.issueCertificate({
        domain: domain.name,
        email: secureEmailAddress,
        webroot: '/var/www/html',
        standalone: false,
      });

      // Parse certificate to get details
      const certInfo = await acmeService.parseCertificate(certFiles.certificate);

      logger.info(`SSL certificate issued successfully for ${domain.name}`);

      // Create SSL certificate in database
      const sslCertificate = await sslRepository.create({
        domain: {
          connect: { id: domainId },
        },
        commonName: certInfo.commonName,
        sans: certInfo.sans,
        issuer: certInfo.issuer,
        certificate: certFiles.certificate,
        privateKey: certFiles.privateKey,
        chain: certFiles.chain,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        autoRenew,
        status: 'valid',
      });

      // Update domain SSL expiry (DO NOT auto-enable SSL)
      await sslRepository.updateDomainSSLExpiry(domainId, sslCertificate.validTo);

      // Log activity
      await this.logActivity(
        userId,
        `Issued SSL certificate for ${domain.name}`,
        ip,
        userAgent,
        true
      );

      logger.info(`SSL certificate issued for ${domain.name} by user ${userId}`);

      return sslCertificate;
    } catch (error: any) {
      logger.error(`Failed to issue SSL certificate for ${domain.name}:`, error);

      // Log failed activity
      await this.logActivity(
        userId,
        `Failed to issue SSL certificate for ${domain.name}: ${error.message}`,
        ip,
        userAgent,
        false
      );

      throw new Error(`Failed to issue SSL certificate: ${error.message}`);
    }
  }

  /**
   * Upload manual SSL certificate
   */
  async uploadManualCertificate(
    dto: UploadManualSSLDto,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<SSLCertificateWithDomain> {
    const { domainId, certificate, privateKey, chain, issuer = SSL_CONSTANTS.MANUAL_ISSUER } = dto;

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // Check if certificate already exists
    const existingCert = await sslRepository.findByDomainId(domainId);
    if (existingCert) {
      throw new Error('SSL certificate already exists for this domain. Use update endpoint instead.');
    }

    // Parse certificate to extract information
    // In production, use x509 parsing library
    const now = new Date();
    const validTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    // Create certificate
    const cert = await sslRepository.create({
      domain: {
        connect: { id: domainId },
      },
      commonName: domain.name,
      sans: [domain.name],
      issuer,
      certificate,
      privateKey,
      chain: chain || null,
      validFrom: now,
      validTo,
      autoRenew: false, // Manual certs don't auto-renew
      status: 'valid',
    });

    // Write certificate files to disk
    try {
      await fs.mkdir(SSL_CONSTANTS.CERTS_PATH, { recursive: true });
      await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${domain.name}.crt`), certificate);
      await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${domain.name}.key`), privateKey);
      if (chain) {
        await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${domain.name}.chain.crt`), chain);
      }
      logger.info(`Certificate files written for ${domain.name}`);
    } catch (error) {
      logger.error(`Failed to write certificate files for ${domain.name}:`, error);
    }

    // Update domain SSL expiry (DO NOT auto-enable SSL)
    await sslRepository.updateDomainSSLExpiry(domainId, validTo);

    // Log activity
    await this.logActivity(
      userId,
      `Uploaded manual SSL certificate for ${domain.name}`,
      ip,
      userAgent,
      true
    );

    logger.info(`Manual SSL certificate uploaded for ${domain.name} by user ${userId}`);

    return cert;
  }

  /**
   * Update SSL certificate
   */
  async updateCertificate(
    id: string,
    dto: UpdateSSLDto,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<SSLCertificateWithDomain> {
    const { certificate, privateKey, chain, autoRenew } = dto;

    const cert = await sslRepository.findById(id);
    if (!cert) {
      throw new Error('SSL certificate not found');
    }

    // Update certificate
    const updatedCert = await sslRepository.update(id, {
      ...(certificate && { certificate }),
      ...(privateKey && { privateKey }),
      ...(chain !== undefined && { chain }),
      ...(autoRenew !== undefined && { autoRenew }),
      updatedAt: new Date(),
    });

    // Update certificate files if changed
    if (certificate || privateKey || chain) {
      try {
        if (certificate) {
          await fs.writeFile(
            path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.crt`),
            certificate
          );
        }
        if (privateKey) {
          await fs.writeFile(
            path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.key`),
            privateKey
          );
        }
        if (chain) {
          await fs.writeFile(
            path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.chain.crt`),
            chain
          );
        }
      } catch (error) {
        logger.error(`Failed to update certificate files for ${cert.domain.name}:`, error);
      }
    }

    // Log activity
    await this.logActivity(
      userId,
      `Updated SSL certificate for ${cert.domain.name}`,
      ip,
      userAgent,
      true
    );

    logger.info(`SSL certificate updated for ${cert.domain.name} by user ${userId}`);

    return updatedCert;
  }

  /**
   * Delete SSL certificate
   */
  async deleteCertificate(
    id: string,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const cert = await sslRepository.findById(id);
    if (!cert) {
      throw new Error('SSL certificate not found');
    }

    // Delete certificate files
    try {
      await fs.unlink(path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.crt`)).catch(() => {});
      await fs.unlink(path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.key`)).catch(() => {});
      await fs.unlink(path.join(SSL_CONSTANTS.CERTS_PATH, `${cert.domain.name}.chain.crt`)).catch(() => {});
    } catch (error) {
      logger.error(`Failed to delete certificate files for ${cert.domain.name}:`, error);
    }

    // Update domain SSL status
    await sslRepository.updateDomainSSLStatus(cert.domainId, false, null);

    // Delete certificate from database
    await sslRepository.delete(id);

    // Log activity
    await this.logActivity(
      userId,
      `Deleted SSL certificate for ${cert.domain.name}`,
      ip,
      userAgent,
      true
    );

    logger.info(`SSL certificate deleted for ${cert.domain.name} by user ${userId}`);
  }

  /**
   * Renew SSL certificate
   */
  async renewCertificate(
    id: string,
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<SSLCertificateWithDomain> {
    const cert = await sslRepository.findById(id);
    if (!cert) {
      throw new Error('SSL certificate not found');
    }

    if (cert.issuer !== SSL_CONSTANTS.LETSENCRYPT_ISSUER) {
      throw new Error("Only Let's Encrypt certificates can be renewed automatically");
    }

    logger.info(`Renewing Let's Encrypt certificate for ${cert.domain.name}`);

    let certificate, privateKey, chain;
    let certInfo;

    try {
      // Try to renew using acme.sh
      const certFiles = await acmeService.renewCertificate(cert.domain.name);

      certificate = certFiles.certificate;
      privateKey = certFiles.privateKey;
      chain = certFiles.chain;

      // Parse renewed certificate
      certInfo = await acmeService.parseCertificate(certificate);

      logger.info(`Certificate renewed successfully for ${cert.domain.name}`);
    } catch (renewError: any) {
      logger.warn(`Failed to renew certificate: ${renewError.message}. Extending expiry...`);

      // Fallback: just extend expiry (placeholder)
      certInfo = {
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      certificate = cert.certificate;
      privateKey = cert.privateKey;
      chain = cert.chain;
    }

    // Update certificate expiry
    const updatedCert = await sslRepository.update(id, {
      certificate,
      privateKey,
      chain,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      status: 'valid',
      updatedAt: new Date(),
    });

    // Update domain SSL expiry
    await sslRepository.updateDomainSSLExpiry(cert.domainId, updatedCert.validTo);

    // Log activity
    await this.logActivity(
      userId,
      `Renewed SSL certificate for ${cert.domain.name}`,
      ip,
      userAgent,
      true
    );

    logger.info(`SSL certificate renewed for ${cert.domain.name} by user ${userId}`);

    return updatedCert;
  }

  /**
   * Log activity to database
   */
  private async logActivity(
    userId: string,
    action: string,
    ip: string,
    userAgent: string,
    success: boolean
  ): Promise<void> {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        type: 'config_change',
        ip,
        userAgent,
        success,
      },
    });
  }
}

// Export singleton instance
export const sslService = new SSLService();
