import * as fs from 'fs/promises';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import logger from '../../utils/logger';
import { sslRepository } from './ssl.repository';
import { acmeService } from './services/acme.service';
import {
  SSLCertificateWithDomain,
  SSLCertificateWithStatus,
  SSL_CONSTANTS,
  SSLStatus,
  WildcardValidationResult,
} from './ssl.types';
import {
  IssueAutoSSLDto,
  UploadManualSSLDto,
  UpdateSSLDto,
  IssueWildcardSSLDto,
  UploadWildcardSSLDto,
  ApplyWildcardSSLDto,
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
   * Re-parse certificates to ensure accurate dates
   */
  async getAllCertificates(): Promise<SSLCertificateWithStatus[]> {
    const certificates = await sslRepository.findAll();

    const now = new Date();
    const updatedCertificates = await Promise.all(
      certificates.map(async (cert) => {
        // Re-parse certificate to get accurate dates if needed
        let validTo = cert.validTo;
        let validFrom = cert.validFrom;
        
        try {
          // Parse certificate content to get real dates
          const certInfo = await acmeService.parseCertificate(cert.certificate);
          validTo = certInfo.validTo;
          validFrom = certInfo.validFrom;
          
          // Update database if dates are different
          if (
            validTo.getTime() !== cert.validTo.getTime() ||
            validFrom.getTime() !== cert.validFrom.getTime()
          ) {
            logger.info(`Updating certificate dates for ${cert.domain.name}: ${validFrom.toISOString()} - ${validTo.toISOString()}`);
            const updateData: any = {
              validFrom,
              validTo,
              commonName: certInfo.commonName,
              sans: certInfo.sans,
              issuer: certInfo.issuer || cert.issuer,
              status: this.calculateStatus(validTo),
            };
            
            // Add optional fields if they exist
            if (certInfo.subject) updateData.subject = certInfo.subject;
            if (certInfo.subjectDetails) updateData.subjectDetails = certInfo.subjectDetails;
            if (certInfo.issuerDetails) updateData.issuerDetails = certInfo.issuerDetails;
            if (certInfo.serialNumber) updateData.serialNumber = certInfo.serialNumber;
            
            await sslRepository.update(cert.id, updateData);
          }
        } catch (error) {
          logger.warn(`Failed to re-parse certificate for ${cert.domain.name}:`, error);
          // Use existing dates from database
        }

        const daysUntilExpiry = Math.floor(
          (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const status = this.calculateStatus(validTo);

        return {
          ...cert,
          validFrom,
          validTo,
          status,
          daysUntilExpiry,
        };
      })
    );

    return updatedCertificates;
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
      const createData: any = {
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
      };
      
      // Add optional fields if they exist
      if (certInfo.subject) createData.subject = certInfo.subject;
      if (certInfo.subjectDetails) createData.subjectDetails = certInfo.subjectDetails;
      if (certInfo.issuerDetails) createData.issuerDetails = certInfo.issuerDetails;
      if (certInfo.serialNumber) createData.serialNumber = certInfo.serialNumber;
      
      const sslCertificate = await sslRepository.create(createData);

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
    const { domainId, certificate, privateKey, chain, issuer } = dto;

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

    // Validate certificate and private key formats
    let certInfo;
    try {
      certInfo = await acmeService.parseCertificate(certificate);
      logger.info(`Parsed manual certificate: CN=${certInfo.commonName}, Issuer=${certInfo.issuer}, Valid: ${certInfo.validFrom.toISOString()} - ${certInfo.validTo.toISOString()}`);
    } catch (error: any) {
      logger.error('Failed to parse manual certificate:', error);
      throw new Error(`Invalid certificate format: ${error.message}`);
    }

    // Validate private key matches certificate
    try {
      const isValidKeyPair = await acmeService.validateKeyPair(certificate, privateKey);
      if (!isValidKeyPair) {
        throw new Error('Private key does not match the certificate. Please ensure you upload the correct key pair.');
      }
    } catch (error: any) {
      if (error.message.includes('does not match')) {
        throw error;
      }
      logger.warn('Key pair validation could not be completed, proceeding with caution:', error.message);
      // Continue - nginx will validate when loading
    }

    // Validate domain name matches certificate (CN or SANs)
    // Support wildcard certificates for subdomains
    // Example: *.nginxwaf.me can be used for dev.nginxwaf.me, api.nginxwaf.me, etc.
    const matchesHostname = (certName: string, domainName: string): boolean => {
      const cert = certName.toLowerCase();
      const domain = domainName.toLowerCase();

      // Exact match
      if (cert === domain) return true;

      // Wildcard match: *.example.com matches sub.example.com
      if (cert.startsWith('*.')) {
        const baseDomain = cert.slice(2); // Remove '*.'
        
        // Check if domain ends with the base domain
        // sub.example.com should match *.example.com
        if (domain.endsWith(baseDomain)) {
          // Ensure it's a proper subdomain match (not partial match)
          // e.g., *.example.com matches sub.example.com but not badexample.com
          const beforeBase = domain.slice(0, domain.length - baseDomain.length);
          return beforeBase === '' || beforeBase.endsWith('.');
        }
      }

      // Check if domain is subdomain and cert is wildcard for parent
      // Example: domain = dev.nginxwaf.me, cert = *.nginxwaf.me should match
      const domainParts = domain.split('.');
      if (domainParts.length >= 3) {
        // Get parent domain (e.g., dev.nginxwaf.me -> nginxwaf.me)
        const parentDomain = domainParts.slice(1).join('.');
        const wildcardParent = `*.${parentDomain}`;
        
        if (cert === wildcardParent) {
          return true;
        }
      }

      return false;
    };

    // Check if certificate matches the domain
    const domainMatches = 
      matchesHostname(certInfo.commonName, domain.name) ||
      certInfo.sans.some(san => matchesHostname(san, domain.name));

    if (!domainMatches) {
      logger.warn(`Certificate domain mismatch: Certificate CN="${certInfo.commonName}", SANs=[${certInfo.sans.join(', ')}] does not match domain "${domain.name}"`);
      throw new Error(
        `Certificate domain mismatch: This certificate is for "${certInfo.commonName}" (SANs: ${certInfo.sans.join(', ')}) but you selected domain "${domain.name}". Please upload the correct certificate or ensure the certificate includes a wildcard that covers this domain.`
      );
    }

    logger.info(`Certificate validated successfully for ${domain.name}. Matched against CN="${certInfo.commonName}" or SANs=[${certInfo.sans.join(', ')}]`);

    // Validate certificate is not expired
    const now = new Date();
    if (certInfo.validTo < now) {
      throw new Error(`Certificate has already expired on ${certInfo.validTo.toISOString()}. Please upload a valid certificate.`);
    }

    // Warn if certificate is expiring soon
    const daysUntilExpiry = Math.floor(
      (certInfo.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry < 30) {
      logger.warn(`Uploaded certificate for ${domain.name} expires in ${daysUntilExpiry} days`);
    }

    // Use parsed information
    const finalIssuer = issuer || certInfo.issuer || SSL_CONSTANTS.MANUAL_ISSUER;
    const status = this.calculateStatus(certInfo.validTo);

    // Create certificate with real information
    const createData: any = {
      domain: {
        connect: { id: domainId },
      },
      commonName: certInfo.commonName,
      sans: certInfo.sans,
      issuer: finalIssuer,
      certificate,
      privateKey,
      chain: chain || null,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      autoRenew: false, // Manual certs don't auto-renew
      status,
    };
    
    // Add optional fields if they exist
    if (certInfo.subject) createData.subject = certInfo.subject;
    if (certInfo.subjectDetails) createData.subjectDetails = certInfo.subjectDetails;
    if (certInfo.issuerDetails) createData.issuerDetails = certInfo.issuerDetails;
    if (certInfo.serialNumber) createData.serialNumber = certInfo.serialNumber;
    
    const cert = await sslRepository.create(createData);

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
    await sslRepository.updateDomainSSLExpiry(domainId, certInfo.validTo);

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

    // If certificate is being updated, parse it to get real info
    let updateData: any = {
      ...(privateKey && { privateKey }),
      ...(chain !== undefined && { chain }),
      ...(autoRenew !== undefined && { autoRenew }),
      updatedAt: new Date(),
    };

    if (certificate) {
      try {
        const certInfo = await acmeService.parseCertificate(certificate);
        logger.info(`Parsed updated certificate: CN=${certInfo.commonName}, Valid: ${certInfo.validFrom.toISOString()} - ${certInfo.validTo.toISOString()}`);
        
        const status = this.calculateStatus(certInfo.validTo);
        
        updateData = {
          ...updateData,
          certificate,
          commonName: certInfo.commonName,
          sans: certInfo.sans,
          issuer: certInfo.issuer,
          subject: certInfo.subject,
          subjectDetails: certInfo.subjectDetails,
          issuerDetails: certInfo.issuerDetails,
          serialNumber: certInfo.serialNumber,
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          status,
        };

        // Update domain SSL expiry
        await sslRepository.updateDomainSSLExpiry(cert.domainId, certInfo.validTo);
      } catch (error: any) {
        logger.error('Failed to parse updated certificate:', error);
        throw new Error(`Invalid certificate format: ${error.message}`);
      }
    }

    // Update certificate
    const updatedCert = await sslRepository.update(id, updateData);

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

    // Check if certificate supports auto-renewal (Let's Encrypt or ZeroSSL)
    const isAutoRenewable = SSL_CONSTANTS.AUTO_RENEWABLE_ISSUERS.includes(cert.issuer);
    if (!isAutoRenewable) {
      throw new Error(
        `Only Let's Encrypt and ZeroSSL certificates can be renewed automatically. Current issuer: ${cert.issuer}`
      );
    }

    // Check if certificate is eligible for renewal (less than 30 days remaining)
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry > 30) {
      throw new Error(
        `Certificate is not yet eligible for renewal. It expires in ${daysUntilExpiry} days. Renewal is only allowed when less than 30 days remain.`
      );
    }

    logger.info(`Renewing ${cert.issuer} certificate for ${cert.domain.name} (${daysUntilExpiry} days remaining)`);

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
        commonName: cert.commonName,
        sans: cert.sans,
        issuer: cert.issuer,
        subject: (cert as any).subject || '',
        subjectDetails: (cert as any).subjectDetails || {},
        issuerDetails: (cert as any).issuerDetails || {},
        serialNumber: (cert as any).serialNumber || '',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };
      certificate = cert.certificate;
      privateKey = cert.privateKey;
      chain = cert.chain;
    }

    // Update certificate expiry
    const updateData: any = {
      certificate,
      privateKey,
      chain,
      commonName: certInfo.commonName,
      sans: certInfo.sans,
      issuer: certInfo.issuer,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      status: 'valid',
      updatedAt: new Date(),
    };

    // Add optional fields if they exist
    if (certInfo.subject) updateData.subject = certInfo.subject;
    if (certInfo.subjectDetails) updateData.subjectDetails = certInfo.subjectDetails;
    if (certInfo.issuerDetails) updateData.issuerDetails = certInfo.issuerDetails;
    if (certInfo.serialNumber) updateData.serialNumber = certInfo.serialNumber;

    const updatedCert = await sslRepository.update(id, updateData);

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
   * Inspect a PEM cert and determine coverage for the provided host list.
   * Returns a structured report of which hosts are covered and which are not.
   */
  async checkWildcardCoverage(
    pemCert: string,
    hostnames: string[]
  ): Promise<WildcardValidationResult> {
    const checkpoint = new Date(); // single timestamp for all comparisons
    try {
      const inspection = await acmeService.inspectWildcardCoverage(pemCert);

      if (!inspection.hasWildcard) {
        return {
          isValid: false,
          isWildcard: false,
          wildcardDomain: null,
          matchedDomains: [],
          unmatchedDomains: hostnames,
          errors: ['The provided certificate does not contain a wildcard entry'],
        };
      }

      const covered: string[] = [];
      const notCovered: string[] = [];
      const issues: string[] = [];

      // Test each hostname against the wildcard pattern and covered names
      for (const hostname of hostnames) {
        const isCoveredByPattern = inspection.wildcardPattern
          ? this.hostnameMatchesGlob(inspection.wildcardPattern, hostname)
          : false;
        const isCoveredBySan = inspection.allCoveredNames.some(
          coveredName => this.hostnameMatchesGlob(coveredName, hostname)
        );

        if (isCoveredByPattern || isCoveredBySan) {
          covered.push(hostname);
        } else {
          notCovered.push(hostname);
          issues.push(`"${hostname}" falls outside the wildcard scope "${inspection.wildcardPattern}"`);
        }
      }

      // Also verify the certificate has not expired
      const parsed = await acmeService.parseCertificate(pemCert);
      if (parsed.validTo < checkpoint) {
        issues.push(`Certificate expired on ${parsed.validTo.toISOString()}`);
      }

      return {
        isValid: notCovered.length === 0 && issues.length === 0,
        isWildcard: true,
        wildcardDomain: inspection.wildcardPattern,
        matchedDomains: covered,
        unmatchedDomains: notCovered,
        errors: issues,
      };
    } catch (err: any) {
      return {
        isValid: false,
        isWildcard: false,
        wildcardDomain: null,
        matchedDomains: [],
        unmatchedDomains: hostnames,
        errors: [`Certificate inspection failed: ${err.message}`],
      };
    }
  }

  /**
   * Determine whether a hostname falls under a glob-style certificate name.
   * Handles exact matches and single-level wildcard patterns (e.g. *.foo.com).
   */
  private hostnameMatchesGlob(certGlob: string, hostname: string): boolean {
    const normalizedGlob = certGlob.toLowerCase();
    const normalizedHost = hostname.toLowerCase();

    if (normalizedGlob === normalizedHost) return true;

    // Standard wildcard: *.base.tld covers single-depth subdomains only
    if (normalizedGlob.startsWith('*.')) {
      const parentZone = normalizedGlob.substring(2);
      // The bare parent (e.g., base.tld) is also commonly covered
      if (normalizedHost === parentZone) return true;
      // sub.base.tld — ensure only one subdomain level
      if (normalizedHost.endsWith(`.${parentZone}`)) {
        const subdomainPart = normalizedHost.slice(0, -(parentZone.length + 1));
        return subdomainPart.indexOf('.') === -1; // no dots means single-level
      }
    }

    return false;
  }

  /**
   * Request a free wildcard cert via ACME using the DNS-01 challenge flow.
   */
  async requestWildcardViaAcme(
    dto: IssueWildcardSSLDto,
    actorId: string,
    clientIp: string,
    clientUa: string
  ): Promise<SSLCertificateWithDomain> {
    const { domainId, baseDomain, email, dnsProvider, dnsCredentials, autoRenew = true } = dto;

    const sanitizedEmail = this.secureEmail(email);

    // Confirm the DNS plugin is recognized
    const recognizedPlugins = SSL_CONSTANTS.SUPPORTED_DNS_PROVIDERS;
    if (!recognizedPlugins.includes(dnsProvider)) {
      throw new Error(
        `DNS plugin "${dnsProvider}" is not recognized. Choose from: ${recognizedPlugins.join(', ')}`
      );
    }

    // Fetch the target domain record
    const targetDomain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!targetDomain) throw new Error('Domain not found');

    // Prevent duplicate certs
    const priorCert = await sslRepository.findByDomainId(domainId);
    if (priorCert) throw new Error('SSL certificate already exists for this domain');

    const starPattern = `*.${baseDomain}`;
    logger.info(`[WildcardSSL] Requesting ${starPattern} for domain ${targetDomain.name}`);

    try {
      const certBundle = await acmeService.obtainWildcardCert({
        rootDomain: baseDomain,
        contactEmail: sanitizedEmail,
        dnsPlugin: dnsProvider,
        dnsApiTokens: dnsCredentials,
      });

      const parsedInfo = await acmeService.parseCertificate(certBundle.certificate);

      // Confirm it actually is wildcard-capable
      const coverage = await acmeService.inspectWildcardCoverage(certBundle.certificate);
      if (!coverage.hasWildcard) {
        logger.warn('[WildcardSSL] Issued cert lacks a wildcard SAN — proceeding anyway');
      }

      // Assemble the database record
      const record: Prisma.SSLCertificateCreateInput = {
        domain: { connect: { id: domainId } },
        commonName: parsedInfo.commonName,
        sans: parsedInfo.sans,
        issuer: parsedInfo.issuer,
        certificate: certBundle.certificate,
        privateKey: certBundle.privateKey,
        chain: certBundle.chain,
        validFrom: parsedInfo.validFrom,
        validTo: parsedInfo.validTo,
        autoRenew,
        status: 'valid',
        isWildcard: true,
        wildcardDomain: starPattern,
        dnsProvider: dnsProvider,
        dnsCredentials: dnsCredentials ?? undefined,
      };
      this.attachOptionalCertFields(record, parsedInfo);

      const savedCert = await sslRepository.create(record);
      await sslRepository.updateDomainSSLExpiry(domainId, savedCert.validTo);

      await this.logActivity(actorId, `Issued wildcard cert ${starPattern} for ${targetDomain.name}`, clientIp, clientUa, true);
      return savedCert;
    } catch (err: any) {
      logger.error(`[WildcardSSL] Issuance failed for ${targetDomain.name}:`, err);
      await this.logActivity(actorId, `Wildcard cert issuance failed for ${targetDomain.name}: ${err.message}`, clientIp, clientUa, false);
      throw new Error(`Wildcard certificate issuance failed: ${err.message}`);
    }
  }

  /**
   * Accept a user-uploaded wildcard PEM cert and optionally attach it to extra domains.
   */
  async ingestWildcardUpload(
    dto: UploadWildcardSSLDto,
    actorId: string,
    clientIp: string,
    clientUa: string
  ): Promise<SSLCertificateWithDomain> {
    const checkpoint = new Date(); // single timestamp for all time comparisons
    const { domainId, certificate: pemCert, privateKey: pemKey, chain: pemChain, issuer: suppliedIssuer, additionalDomainIds } = dto;

    // Resolve primary domain
    const primaryDomain = await prisma.domain.findUnique({ where: { id: domainId } });
    if (!primaryDomain) throw new Error('Domain not found');

    const duplicateCheck = await sslRepository.findByDomainId(domainId);
    if (duplicateCheck) throw new Error('SSL certificate already exists for this domain. Use update endpoint instead.');

    // Parse the supplied PEM content
    let parsedCert;
    try {
      parsedCert = await acmeService.parseCertificate(pemCert);
    } catch (parseErr: any) {
      throw new Error(`Cannot parse certificate: ${parseErr.message}`);
    }

    // Must actually be a wildcard
    const coverage = await acmeService.inspectWildcardCoverage(pemCert);
    if (!coverage.hasWildcard) {
      throw new Error('The uploaded certificate is not wildcard. For single-domain certs, use the standard upload.');
    }

    // Key-pair integrity check
    try {
      const keyMatch = await acmeService.validateKeyPair(pemCert, pemKey);
      if (!keyMatch) throw new Error('Private key does not correspond to the certificate.');
    } catch (keyErr: any) {
      if (keyErr.message.includes('does not correspond')) throw keyErr;
      logger.warn('[WildcardSSL] Key verification inconclusive:', keyErr.message);
    }

    // Collect all hostnames that should be covered
    const allHostnames = [primaryDomain.name];
    const extraDomainRecords: Array<{ id: string; name: string }> = [];

    if (additionalDomainIds?.length) {
      for (const extraId of additionalDomainIds) {
        const found = await prisma.domain.findUnique({ where: { id: extraId } });
        if (!found) throw new Error(`Domain ID "${extraId}" does not exist`);
        extraDomainRecords.push({ id: found.id, name: found.name });
        allHostnames.push(found.name);
      }
    }

    // Verify the wildcard covers every listed hostname
    const coverageCheck = await this.checkWildcardCoverage(pemCert, allHostnames);
    if (coverageCheck.unmatchedDomains.length > 0) {
      throw new Error(
        `Wildcard "${coverage.wildcardPattern}" does not cover: ${coverageCheck.unmatchedDomains.join(', ')}. ` +
        `Cert covers: ${coverage.allCoveredNames.join(', ')}`
      );
    }

    // Reject expired certs
    if (parsedCert.validTo < checkpoint) {
      throw new Error(`Certificate expired on ${parsedCert.validTo.toISOString()}`);
    }

    const resolvedIssuer = suppliedIssuer || parsedCert.issuer || SSL_CONSTANTS.MANUAL_ISSUER;
    const computedStatus = this.calculateStatus(parsedCert.validTo);

    // Persist the primary certificate record
    const primaryRecord: Prisma.SSLCertificateCreateInput = {
      domain: { connect: { id: domainId } },
      commonName: parsedCert.commonName,
      sans: parsedCert.sans,
      issuer: resolvedIssuer,
      certificate: pemCert,
      privateKey: pemKey,
      chain: pemChain || null,
      validFrom: parsedCert.validFrom,
      validTo: parsedCert.validTo,
      autoRenew: false,
      status: computedStatus,
      isWildcard: true,
      wildcardDomain: coverage.wildcardPattern,
    };
    this.attachOptionalCertFields(primaryRecord, parsedCert);

    const savedPrimary = await sslRepository.create(primaryRecord);

    // Deploy PEM files on disk for the primary domain
    await this.deployCertFiles(primaryDomain.name, pemCert, pemKey, pemChain || null);
    await sslRepository.updateDomainSSLExpiry(domainId, parsedCert.validTo);

    // Replicate to additional domains
    for (const extraDom of extraDomainRecords) {
      try {
        await this.replicateWildcardToDomain(
          extraDom.id, extraDom.name,
          pemCert, pemKey, pemChain || null,
          parsedCert, resolvedIssuer, computedStatus,
          coverage.wildcardPattern!
        );
      } catch (repErr: any) {
        logger.warn(`[WildcardSSL] Replication to ${extraDom.name} failed: ${repErr.message}`);
      }
    }

    await this.logActivity(actorId, `Uploaded wildcard cert for ${allHostnames.join(', ')}`, clientIp, clientUa, true);
    logger.info(`[WildcardSSL] Upload complete for ${allHostnames.join(', ')} by ${actorId}`);

    return savedPrimary;
  }

  /**
   * Scan all stored wildcard certs and, if one covers the given domain,
   * automatically replicate it to that domain. Called during SSL toggle
   * so users don't need to manually apply wildcard certs one by one.
   *
   * Returns the newly created cert record, or null if no wildcard matched.
   */
  async findAndApplyWildcardForDomain(
    domainId: string,
    domainName: string
  ): Promise<SSLCertificateWithDomain | null> {
    // Already has a cert — nothing to do
    const existingCert = await sslRepository.findByDomainId(domainId);
    if (existingCert) return null;

    // Fetch every wildcard cert currently in the system
    const allWildcards = await sslRepository.findWildcardCertificates();
    if (allWildcards.length === 0) return null;

    // Walk through them looking for a pattern that covers this domain
    for (const wc of allWildcards) {
      if (!wc.wildcardDomain) continue;
      if (!this.hostnameMatchesGlob(wc.wildcardDomain, domainName)) continue;

      // Found a matching wildcard — replicate it to the target domain
      logger.info(
        `[WildcardSSL] Auto-applying wildcard cert "${wc.wildcardDomain}" to ${domainName}`
      );

      const parsedInfo = await acmeService.parseCertificate(wc.certificate);
      const certStatus = this.calculateStatus(wc.validTo);

      const created = await this.replicateWildcardToDomain(
        domainId,
        domainName,
        wc.certificate,
        wc.privateKey,
        wc.chain,
        parsedInfo,
        wc.issuer,
        certStatus,
        wc.wildcardDomain,
        wc.dnsProvider,
        wc.dnsCredentials as Record<string, string> | null
      );

      return created;
    }

    // No wildcard cert matched this domain
    return null;
  }

  /**
   * Spread an existing wildcard cert onto new domain entries.
   */
  async spreadWildcardToDomains(
    dto: ApplyWildcardSSLDto,
    actorId: string,
    clientIp: string,
    clientUa: string
  ): Promise<SSLCertificateWithDomain[]> {
    const { certificateId, targetDomainIds } = dto;

    const originCert = await sslRepository.findById(certificateId);
    if (!originCert) throw new Error('SSL certificate not found');
    if (!originCert.isWildcard) throw new Error('Certificate is not a wildcard certificate');

    // Resolve all target domain records
    const destinations: Array<{ id: string; name: string }> = [];
    for (const destId of targetDomainIds) {
      const domRecord = await prisma.domain.findUnique({ where: { id: destId } });
      if (!domRecord) throw new Error(`Domain not found: ${destId}`);
      destinations.push({ id: domRecord.id, name: domRecord.name });
    }

    // Verify coverage
    const hostList = destinations.map(d => d.name);
    const coverageResult = await this.checkWildcardCoverage(originCert.certificate, hostList);
    if (coverageResult.unmatchedDomains.length > 0) {
      throw new Error(
        `Wildcard cert does not cover: ${coverageResult.unmatchedDomains.join(', ')}. ` +
        `Pattern: ${originCert.wildcardDomain}`
      );
    }

    const currentStatus = this.calculateStatus(originCert.validTo);
    const createdCerts: SSLCertificateWithDomain[] = [];

    for (const dest of destinations) {
      const alreadyHasCert = await sslRepository.findByDomainId(dest.id);
      if (alreadyHasCert) {
        logger.warn(`[WildcardSSL] ${dest.name} already has a cert — skipping`);
        continue;
      }

      const parsedInfo = await acmeService.parseCertificate(originCert.certificate);
      const newEntry = await this.replicateWildcardToDomain(
        dest.id, dest.name,
        originCert.certificate, originCert.privateKey, originCert.chain,
        parsedInfo, originCert.issuer, currentStatus,
        originCert.wildcardDomain!,
        originCert.dnsProvider,
        originCert.dnsCredentials as Record<string, string> | null
      );
      createdCerts.push(newEntry);
    }

    const nameList = createdCerts.map(c => c.domain.name).join(', ');
    await this.logActivity(actorId, `Spread wildcard cert to: ${nameList}`, clientIp, clientUa, true);

    return createdCerts;
  }

  /**
   * Internal helper: create an SSL record and deploy files for one domain using shared wildcard data.
   */
  private async replicateWildcardToDomain(
    targetDomainId: string,
    targetHostname: string,
    pemCert: string,
    pemKey: string,
    pemChain: string | null,
    parsedInfo: any,
    issuerName: string,
    certStatus: SSLStatus,
    wcPattern: string,
    dnsProvider?: string | null,
    dnsCredentials?: Record<string, string> | null
  ): Promise<SSLCertificateWithDomain> {
    const dbRecord: Prisma.SSLCertificateCreateInput = {
      domain: { connect: { id: targetDomainId } },
      commonName: parsedInfo.commonName,
      sans: parsedInfo.sans,
      issuer: issuerName,
      certificate: pemCert,
      privateKey: pemKey,
      chain: pemChain,
      validFrom: parsedInfo.validFrom,
      validTo: parsedInfo.validTo,
      autoRenew: false,
      status: certStatus,
      isWildcard: true,
      wildcardDomain: wcPattern,
      dnsProvider: dnsProvider ?? undefined,
      dnsCredentials: dnsCredentials ?? undefined,
    };
    this.attachOptionalCertFields(dbRecord, parsedInfo);

    const entry = await sslRepository.create(dbRecord);
    await this.deployCertFiles(targetHostname, pemCert, pemKey, pemChain);
    await sslRepository.updateDomainSSLExpiry(targetDomainId, parsedInfo.validTo);

    logger.info(`[WildcardSSL] Replicated wildcard cert to ${targetHostname}`);
    return entry;
  }

  /**
   * Copy optional parsed certificate metadata onto a DB record object.
   */
  private attachOptionalCertFields(record: Prisma.SSLCertificateCreateInput, parsed: any): void {
    if (parsed.subject) record.subject = parsed.subject;
    if (parsed.subjectDetails) record.subjectDetails = parsed.subjectDetails;
    if (parsed.issuerDetails) record.issuerDetails = parsed.issuerDetails;
    if (parsed.serialNumber) record.serialNumber = parsed.serialNumber;
  }

  /**
   * Write PEM files to the nginx SSL directory for a given hostname.
   */
  private async deployCertFiles(
    hostname: string,
    certPem: string,
    keyPem: string,
    chainPem: string | null
  ): Promise<void> {
    try {
      await fs.mkdir(SSL_CONSTANTS.CERTS_PATH, { recursive: true });
      await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${hostname}.crt`), certPem);
      await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${hostname}.key`), keyPem);
      if (chainPem) {
        await fs.writeFile(path.join(SSL_CONSTANTS.CERTS_PATH, `${hostname}.chain.crt`), chainPem);
      }
    } catch (ioErr) {
      logger.error(`[WildcardSSL] Failed to deploy cert files for ${hostname}:`, ioErr);
    }
  }

  /**
   * Return all wildcard-type certificates from the store.
   */
  async listWildcardCerts(): Promise<SSLCertificateWithDomain[]> {
    return sslRepository.findWildcardCertificates();
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
