import logger from '../../../utils/logger';
import { sslRepository } from '../ssl.repository';
import { acmeService } from './acme.service';
import { SSL_CONSTANTS } from '../ssl.types';

/**
 * SSL Auto-Renew Scheduler Service
 * Automatically checks and renews SSL certificates that are expiring soon
 * Similar to backup-scheduler but for SSL certificates
 */
class SSLSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 3600000; // Check every 1 hour by default
  private renewThresholdDays: number = 30; // Renew if cert expires in 30 days or less

  /**
   * Check and renew expiring SSL certificates
   */
  async checkAndRenewExpiringCertificates(): Promise<void> {
    try {
      logger.debug('Checking for expiring SSL certificates...');

      // Get all SSL certificates
      const certificates = await sslRepository.findAll();

      const now = new Date();
      const thresholdDate = new Date(now.getTime() + this.renewThresholdDays * 24 * 60 * 60 * 1000);

      for (const cert of certificates) {
        // Skip if autoRenew is disabled
        if (!cert.autoRenew) {
          logger.debug(`Certificate ${cert.id} (${cert.domain.name}) has autoRenew disabled, skipping...`);
          continue;
        }

        // Skip if not Let's Encrypt (manual certs can't be auto-renewed)
        if (cert.issuer !== SSL_CONSTANTS.LETSENCRYPT_ISSUER) {
          logger.debug(`Certificate ${cert.id} (${cert.domain.name}) is not Let's Encrypt, skipping...`);
          continue;
        }

        // Check if certificate is expiring soon
        if (cert.validTo <= thresholdDate) {
          const daysUntilExpiry = Math.floor(
            (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          logger.info(
            `Certificate for ${cert.domain.name} expires in ${daysUntilExpiry} days, attempting renewal...`
          );

          // Execute renewal asynchronously (don't wait)
          this.renewCertificate(cert.id, cert.domain.name)
            .catch(error => {
              logger.error(`Failed to auto-renew certificate ${cert.id} (${cert.domain.name}):`, error);
            });
        }
      }
    } catch (error) {
      logger.error('Error in checkAndRenewExpiringCertificates:', error);
    }
  }

  /**
   * Renew a specific certificate
   */
  private async renewCertificate(certId: string, domainName: string): Promise<void> {
    try {
      logger.info(`[Auto-Renew] Starting renewal for ${domainName}`);

      // Use acme.sh to renew the certificate
      const certFiles = await acmeService.renewCertificate(domainName);

      // Parse renewed certificate to get validity dates
      const certInfo = await acmeService.parseCertificate(certFiles.certificate);

      // Update certificate in database
      await sslRepository.update(certId, {
        certificate: certFiles.certificate,
        privateKey: certFiles.privateKey,
        chain: certFiles.chain,
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        status: 'valid',
        updatedAt: new Date(),
      });

      // Update domain SSL expiry
      const cert = await sslRepository.findById(certId);
      if (cert) {
        await sslRepository.updateDomainSSLExpiry(cert.domainId, certInfo.validTo);
      }

      logger.info(
        `[Auto-Renew] ✅ Successfully renewed certificate for ${domainName}, valid until ${certInfo.validTo.toISOString()}`
      );
    } catch (error: any) {
      logger.error(`[Auto-Renew] ❌ Failed to renew certificate for ${domainName}:`, error.message);
      
      // Update certificate status to indicate renewal failure
      try {
        await sslRepository.update(certId, {
          status: 'expiring',
          updatedAt: new Date(),
        });
      } catch (updateError) {
        logger.error('Failed to update certificate status:', updateError);
      }

      throw error;
    }
  }

  /**
   * Start the SSL auto-renew scheduler
   */
  start(checkIntervalMs: number = 3600000, renewThresholdDays: number = 30): NodeJS.Timeout {
    if (this.intervalId) {
      logger.warn('SSL auto-renew scheduler is already running');
      return this.intervalId;
    }

    this.checkIntervalMs = checkIntervalMs;
    this.renewThresholdDays = renewThresholdDays;

    logger.info(
      `Starting SSL auto-renew scheduler (check interval: ${checkIntervalMs}ms, renew threshold: ${renewThresholdDays} days)`
    );

    // Initial check
    this.checkAndRenewExpiringCertificates().catch(error => {
      logger.error('Error in initial SSL certificate check:', error);
    });

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.checkAndRenewExpiringCertificates().catch(error => {
        logger.error('Error in scheduled SSL certificate check:', error);
      });
    }, checkIntervalMs);

    logger.info('✅ SSL auto-renew scheduler started successfully');

    return this.intervalId;
  }

  /**
   * Stop the SSL auto-renew scheduler
   */
  stop(timerId?: NodeJS.Timeout): void {
    const timerToStop = timerId || this.intervalId;

    if (timerToStop) {
      clearInterval(timerToStop);
      this.intervalId = null;
      logger.info('SSL auto-renew scheduler stopped');
    } else {
      logger.warn('No SSL auto-renew scheduler to stop');
    }
  }

  /**
   * Get current scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    checkIntervalMs: number;
    renewThresholdDays: number;
  } {
    return {
      isRunning: this.intervalId !== null,
      checkIntervalMs: this.checkIntervalMs,
      renewThresholdDays: this.renewThresholdDays,
    };
  }

  /**
   * Manually trigger a check (for testing)
   */
  async triggerCheck(): Promise<void> {
    logger.info('Manually triggering SSL certificate check...');
    await this.checkAndRenewExpiringCertificates();
  }
}

// Export singleton instance
export const sslSchedulerService = new SSLSchedulerService();

// Named exports for testing
export { SSLSchedulerService };
