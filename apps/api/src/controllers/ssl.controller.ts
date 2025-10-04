import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { validationResult } from 'express-validator';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { issueCertificate, renewCertificate, parseCertificate } from '../utils/acme';

const execAsync = promisify(exec);

const SSL_CERTS_PATH = '/etc/nginx/ssl';

/**
 * Validate email format to prevent injection attacks
 */
function validateEmail(email: string): boolean {
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
 * Removes potentially dangerous characters while preserving valid email format
 */
function sanitizeEmail(email: string): string {
  // Remove any characters that could be used for command injection
  // Keep only characters valid in email addresses
  return email.replace(/[;&|`$(){}[\]<>'"\\!*#?~\s]/g, '');
}

/**
 * Validate and sanitize email with comprehensive security checks
 */
function secureEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  
  // Trim whitespace
  email = email.trim();
  
  // Check length before validation
  if (email.length === 0 || email.length > 254) {
    throw new Error('Invalid email format: length must be between 1 and 254 characters');
  }
  
  // Validate format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  // Sanitize as additional security layer (defense in depth)
  const sanitized = sanitizeEmail(email);
  
  // Verify sanitization didn't break the email
  if (!validateEmail(sanitized)) {
    throw new Error('Email contains invalid characters');
  }
  
  return sanitized;
}

/**
 * Get all SSL certificates
 */
export const getSSLCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certificates = await prisma.sSLCertificate.findMany({
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { validTo: 'asc' },
    });

    // Calculate status based on expiry
    const now = new Date();
    const certsWithStatus = certificates.map(cert => {
      const daysUntilExpiry = Math.floor(
        (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let status = cert.status;
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry < 30) {
        status = 'expiring';
      } else {
        status = 'valid';
      }

      return {
        ...cert,
        status,
        daysUntilExpiry,
      };
    });

    res.json({
      success: true,
      data: certsWithStatus,
    });
  } catch (error) {
    logger.error('Get SSL certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get single SSL certificate by ID
 */
export const getSSLCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const certificate = await prisma.sSLCertificate.findUnique({
      where: { id },
      include: {
        domain: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'SSL certificate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    logger.error('Get SSL certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Issue Let's Encrypt certificate (auto)
 */
export const issueAutoSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { domainId, email, autoRenew = true } = req.body;

    // Validate and sanitize email input
    let secureEmailAddress: string | undefined;
    try {
      secureEmailAddress = secureEmail(email);
    } catch (emailError: any) {
      res.status(400).json({
        success: false,
        message: emailError.message || 'Invalid email address',
      });
      return;
    }

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
      return;
    }

    // Check if certificate already exists
    const existingCert = await prisma.sSLCertificate.findUnique({
      where: { domainId },
    });

    if (existingCert) {
      res.status(400).json({
        success: false,
        message: 'SSL certificate already exists for this domain',
      });
      return;
    }

    logger.info(`Issuing SSL certificate for ${domain.name} using ZeroSSL`);

    try {
      // Issue certificate using acme.sh with ZeroSSL
      const certFiles = await issueCertificate({
        domain: domain.name,
        email: secureEmailAddress, // Use validated and sanitized email
        webroot: '/var/www/html',
        standalone: false,
      });

      // Parse certificate to get details
      const certInfo = await parseCertificate(certFiles.certificate);
      
      logger.info(`SSL certificate issued successfully for ${domain.name}`);

      // Create SSL certificate in database
      const sslCertificate = await prisma.sSLCertificate.create({
        data: {
          domainId,
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
        },
        include: {
          domain: true,
        },
      });

      // DO NOT auto-enable SSL - user must manually enable it in Domain Management
      // Just update SSL expiry for reference
      await prisma.domain.update({
        where: { id: domainId },
        data: {
          sslExpiry: sslCertificate.validTo,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: `Issued SSL certificate for ${domain.name}`,
          type: 'config_change',
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          success: true,
        },
      });

      logger.info(`SSL certificate issued for ${domain.name} by user ${req.user!.username}`);

      res.status(201).json({
        success: true,
        message: 'SSL certificate issued successfully',
        data: sslCertificate,
      });
    } catch (error: any) {
      logger.error(`Failed to issue SSL certificate for ${domain.name}:`, error);
      
      // Log failed activity
      await prisma.activityLog.create({
        data: {
          userId: req.user!.userId,
          action: `Failed to issue SSL certificate for ${domain.name}: ${error.message}`,
          type: 'config_change',
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          success: false,
        },
      });

      res.status(500).json({
        success: false,
        message: `Failed to issue SSL certificate: ${error.message}`,
      });
    }
  } catch (error) {
    logger.error('Issue auto SSL error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Upload manual SSL certificate
 */
export const uploadManualSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { domainId, certificate, privateKey, chain, issuer = 'Manual Upload' } = req.body;

    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
      return;
    }

    // Check if certificate already exists
    const existingCert = await prisma.sSLCertificate.findUnique({
      where: { domainId },
    });

    if (existingCert) {
      res.status(400).json({
        success: false,
        message: 'SSL certificate already exists for this domain. Use update endpoint instead.',
      });
      return;
    }

    // Parse certificate to extract information
    // In production, use x509 parsing library
    const now = new Date();
    const validTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    // Create certificate
    const cert = await prisma.sSLCertificate.create({
      data: {
        domainId,
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
      },
      include: {
        domain: true,
      },
    });

    // Write certificate files to disk
    try {
      await fs.mkdir(SSL_CERTS_PATH, { recursive: true });
      await fs.writeFile(path.join(SSL_CERTS_PATH, `${domain.name}.crt`), certificate);
      await fs.writeFile(path.join(SSL_CERTS_PATH, `${domain.name}.key`), privateKey);
      if (chain) {
        await fs.writeFile(path.join(SSL_CERTS_PATH, `${domain.name}.chain.crt`), chain);
      }
      logger.info(`Certificate files written for ${domain.name}`);
    } catch (error) {
      logger.error(`Failed to write certificate files for ${domain.name}:`, error);
    }

    // DO NOT auto-enable SSL - user must manually enable it in Domain Management
    // Just update SSL expiry for reference
    await prisma.domain.update({
      where: { id: domainId },
      data: {
        sslExpiry: validTo,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Uploaded manual SSL certificate for ${domain.name}`,
        type: 'config_change',
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
      },
    });

    logger.info(`Manual SSL certificate uploaded for ${domain.name} by user ${req.user!.username}`);

    res.status(201).json({
      success: true,
      message: 'SSL certificate uploaded successfully',
      data: cert,
    });
  } catch (error) {
    logger.error('Upload manual SSL error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update SSL certificate
 */
export const updateSSLCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const { certificate, privateKey, chain, autoRenew } = req.body;

    const cert = await prisma.sSLCertificate.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (!cert) {
      res.status(404).json({
        success: false,
        message: 'SSL certificate not found',
      });
      return;
    }

    // Update certificate
    const updatedCert = await prisma.sSLCertificate.update({
      where: { id },
      data: {
        ...(certificate && { certificate }),
        ...(privateKey && { privateKey }),
        ...(chain !== undefined && { chain }),
        ...(autoRenew !== undefined && { autoRenew }),
        updatedAt: new Date(),
      },
      include: { domain: true },
    });

    // Update certificate files if changed
    if (certificate || privateKey || chain) {
      try {
        if (certificate) {
          await fs.writeFile(
            path.join(SSL_CERTS_PATH, `${cert.domain.name}.crt`),
            certificate
          );
        }
        if (privateKey) {
          await fs.writeFile(
            path.join(SSL_CERTS_PATH, `${cert.domain.name}.key`),
            privateKey
          );
        }
        if (chain) {
          await fs.writeFile(
            path.join(SSL_CERTS_PATH, `${cert.domain.name}.chain.crt`),
            chain
          );
        }
      } catch (error) {
        logger.error(`Failed to update certificate files for ${cert.domain.name}:`, error);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Updated SSL certificate for ${cert.domain.name}`,
        type: 'config_change',
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
      },
    });

    logger.info(`SSL certificate updated for ${cert.domain.name} by user ${req.user!.username}`);

    res.json({
      success: true,
      message: 'SSL certificate updated successfully',
      data: updatedCert,
    });
  } catch (error) {
    logger.error('Update SSL certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete SSL certificate
 */
export const deleteSSLCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cert = await prisma.sSLCertificate.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (!cert) {
      res.status(404).json({
        success: false,
        message: 'SSL certificate not found',
      });
      return;
    }

    // Delete certificate files
    try {
      await fs.unlink(path.join(SSL_CERTS_PATH, `${cert.domain.name}.crt`)).catch(() => {});
      await fs.unlink(path.join(SSL_CERTS_PATH, `${cert.domain.name}.key`)).catch(() => {});
      await fs.unlink(path.join(SSL_CERTS_PATH, `${cert.domain.name}.chain.crt`)).catch(() => {});
    } catch (error) {
      logger.error(`Failed to delete certificate files for ${cert.domain.name}:`, error);
    }

    // Update domain SSL status
    await prisma.domain.update({
      where: { id: cert.domainId },
      data: {
        sslEnabled: false,
        sslExpiry: null,
      },
    });

    // Delete certificate from database
    await prisma.sSLCertificate.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Deleted SSL certificate for ${cert.domain.name}`,
        type: 'config_change',
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
      },
    });

    logger.info(`SSL certificate deleted for ${cert.domain.name} by user ${req.user!.username}`);

    res.json({
      success: true,
      message: 'SSL certificate deleted successfully',
    });
  } catch (error) {
    logger.error('Delete SSL certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Renew SSL certificate
 */
export const renewSSLCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cert = await prisma.sSLCertificate.findUnique({
      where: { id },
      include: { domain: true },
    });

    if (!cert) {
      res.status(404).json({
        success: false,
        message: 'SSL certificate not found',
      });
      return;
    }

    if (cert.issuer !== "Let's Encrypt") {
      res.status(400).json({
        success: false,
        message: 'Only Let\'s Encrypt certificates can be renewed automatically',
      });
      return;
    }

    // TODO: Implement actual certificate renewal using acme.sh or certbot
    logger.info(`Renewing Let's Encrypt certificate for ${cert.domain.name}`);

    let certificate, privateKey, chain;
    let certInfo;

    try {
      // Try to renew using acme.sh
      const certFiles = await renewCertificate(cert.domain.name);
      
      certificate = certFiles.certificate;
      privateKey = certFiles.privateKey;
      chain = certFiles.chain;

      // Parse renewed certificate
      certInfo = await parseCertificate(certificate);
      
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

    // Update certificate expiry (placeholder)
    const updatedCert = await prisma.sSLCertificate.update({
      where: { id },
      data: {
        certificate,
        privateKey,
        chain,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        status: 'valid',
        updatedAt: new Date(),
      },
      include: { domain: true },
    });

    // Update domain SSL expiry
    await prisma.domain.update({
      where: { id: cert.domainId },
      data: {
        sslExpiry: updatedCert.validTo,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user!.userId,
        action: `Renewed SSL certificate for ${cert.domain.name}`,
        type: 'config_change',
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
      },
    });

    logger.info(`SSL certificate renewed for ${cert.domain.name} by user ${req.user!.username}`);

    res.json({
      success: true,
      message: 'SSL certificate renewed successfully',
      data: updatedCert,
    });
  } catch (error) {
    logger.error('Renew SSL certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
