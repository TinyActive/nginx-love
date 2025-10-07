import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../../utils/logger';
import { getWebrootPath, setupWebrootDirectory } from '../../../utils/nginx-setup';
import { AcmeOptions, CertificateFiles, ParsedCertificate } from '../ssl.types';

const execAsync = promisify(exec);

/**
 * ACME Service - Handles all Let's Encrypt/ZeroSSL certificate operations
 */
export class AcmeService {
  /**
   * Check if acme.sh is installed
   */
  async isAcmeInstalled(): Promise<boolean> {
    try {
      await execAsync('which acme.sh');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email format to prevent command injection
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize input to prevent command injection
   */
  private sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[;&|`$(){}[\]<>'"\\]/g, '');
  }

  /**
   * Install acme.sh
   */
  async installAcme(email?: string): Promise<void> {
    try {
      logger.info('Installing acme.sh...');

      // Validate and sanitize email if provided
      if (email) {
        if (!this.validateEmail(email)) {
          throw new Error('Invalid email format');
        }
        // Additional sanitization as defense in depth
        email = this.sanitizeInput(email);
      }

      const installCmd = email
        ? `curl https://get.acme.sh | sh -s email=${email}`
        : `curl https://get.acme.sh | sh`;

      await execAsync(installCmd);

      // Add acme.sh to PATH
      const homeDir = process.env.HOME || '/root';
      const acmePath = path.join(homeDir, '.acme.sh');
      process.env.PATH = `${acmePath}:${process.env.PATH}`;

      logger.info('acme.sh installed successfully');
    } catch (error) {
      logger.error('Failed to install acme.sh:', error);
      throw new Error('Failed to install acme.sh');
    }
  }

  /**
   * Issue Let's Encrypt certificate using acme.sh with ZeroSSL as default CA
   */
  async issueCertificate(options: AcmeOptions): Promise<CertificateFiles> {
    try {
      const { domain, sans, email, dns } = options;

      // Check if acme.sh is installed
      const installed = await this.isAcmeInstalled();
      if (!installed) {
        await this.installAcme(email);
      }

      logger.info(`Issuing certificate for ${domain} using ZeroSSL`);

      const homeDir = process.env.HOME || '/root';
      const acmeScript = path.join(homeDir, '.acme.sh', 'acme.sh');

      // Ensure webroot directory exists
      const webroot = options.webroot || getWebrootPath();
      await setupWebrootDirectory();

      // Build domain list (primary + SANs)
      let issueCmd = `${acmeScript} --issue`;

      // Set ZeroSSL as default CA
      issueCmd += ` --server zerossl`;

      // Add primary domain
      issueCmd += ` -d ${domain}`;

      // Add SANs if provided
      if (sans && sans.length > 0) {
        for (const san of sans) {
          if (san !== domain) { // Don't duplicate primary domain
            issueCmd += ` -d ${san}`;
          }
        }
      }

      // Add validation method
      if (dns) {
        issueCmd += ` --dns ${dns}`;
      } else {
        // Default: webroot mode
        issueCmd += ` -w ${webroot}`;
      }

      // Add email if provided
      if (email) {
        issueCmd += ` --accountemail ${email}`;
      }

      // Force issue
      issueCmd += ` --force`;

      const { stdout, stderr } = await execAsync(issueCmd);
      logger.info(`acme.sh output: ${stdout}`);

      if (stderr) {
        logger.warn(`acme.sh stderr: ${stderr}`);
      }

      // Get certificate files - acme.sh creates directory with _ecc suffix for ECC certificates
      const baseDir = path.join(homeDir, '.acme.sh');
      let certDir = path.join(baseDir, domain);

      // Check if ECC directory exists (acme.sh default)
      const eccDir = path.join(baseDir, `${domain}_ecc`);
      if (fs.existsSync(eccDir)) {
        certDir = eccDir;
      }

      const certificateFile = path.join(certDir, `${domain}.cer`);
      const keyFile = path.join(certDir, `${domain}.key`);
      const caFile = path.join(certDir, 'ca.cer');
      const fullchainFile = path.join(certDir, 'fullchain.cer');

      // Read certificate files
      const certificate = await fs.promises.readFile(certificateFile, 'utf8');
      const privateKey = await fs.promises.readFile(keyFile, 'utf8');
      const chain = await fs.promises.readFile(caFile, 'utf8');
      const fullchain = await fs.promises.readFile(fullchainFile, 'utf8');

      // Install certificate to nginx directory
      const nginxSslDir = '/etc/nginx/ssl';
      if (!fs.existsSync(nginxSslDir)) {
        await fs.promises.mkdir(nginxSslDir, { recursive: true });
      }

      const nginxCertFile = path.join(nginxSslDir, `${domain}.crt`);
      const nginxKeyFile = path.join(nginxSslDir, `${domain}.key`);
      const nginxChainFile = path.join(nginxSslDir, `${domain}.chain.crt`);

      await fs.promises.writeFile(nginxCertFile, fullchain);
      await fs.promises.writeFile(nginxKeyFile, privateKey);
      await fs.promises.writeFile(nginxChainFile, chain);

      logger.info(`Certificate installed to ${nginxSslDir}`);

      return {
        certificate,
        privateKey,
        chain,
        fullchain,
      };
    } catch (error: any) {
      logger.error('Failed to issue certificate:', error);
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  /**
   * Renew certificate using acme.sh
   */
  async renewCertificate(domain: string): Promise<CertificateFiles> {
    try {
      logger.info(`Renewing certificate for ${domain}`);

      const homeDir = process.env.HOME || '/root';
      const acmeScript = path.join(homeDir, '.acme.sh', 'acme.sh');

      const renewCmd = `${acmeScript} --renew -d ${domain} --force`;

      const { stdout, stderr } = await execAsync(renewCmd);
      logger.info(`acme.sh renew output: ${stdout}`);

      if (stderr) {
        logger.warn(`acme.sh renew stderr: ${stderr}`);
      }

      // Get renewed certificate files
      const certDir = path.join(homeDir, '.acme.sh', domain);

      const certificate = await fs.promises.readFile(path.join(certDir, `${domain}.cer`), 'utf8');
      const privateKey = await fs.promises.readFile(path.join(certDir, `${domain}.key`), 'utf8');
      const chain = await fs.promises.readFile(path.join(certDir, 'ca.cer'), 'utf8');
      const fullchain = await fs.promises.readFile(path.join(certDir, 'fullchain.cer'), 'utf8');

      // Update nginx files
      const nginxSslDir = '/etc/nginx/ssl';
      await fs.promises.writeFile(path.join(nginxSslDir, `${domain}.crt`), fullchain);
      await fs.promises.writeFile(path.join(nginxSslDir, `${domain}.key`), privateKey);
      await fs.promises.writeFile(path.join(nginxSslDir, `${domain}.chain.crt`), chain);

      logger.info(`Certificate renewed and installed for ${domain}`);

      return {
        certificate,
        privateKey,
        chain,
        fullchain,
      };
    } catch (error: any) {
      logger.error('Failed to renew certificate:', error);
      throw new Error(`Failed to renew certificate: ${error.message}`);
    }
  }

  /**
   * Parse certificate to extract information
   */
  async parseCertificate(certContent: string): Promise<ParsedCertificate> {
    try {
      const { X509Certificate } = await import('crypto');

      const cert = new X509Certificate(certContent);

      const commonName = cert.subject.split('\n').find(line => line.startsWith('CN='))?.replace('CN=', '') || '';
      const issuer = cert.issuer.split('\n').find(line => line.startsWith('O='))?.replace('O=', '') || 'Unknown';

      // Parse SANs from subjectAltName
      const sans: string[] = [];
      const sanMatch = cert.subjectAltName?.match(/DNS:([^,]+)/g);
      if (sanMatch) {
        sanMatch.forEach(san => {
          const domain = san.replace('DNS:', '');
          if (domain) sans.push(domain);
        });
      }

      return {
        commonName,
        sans: sans.length > 0 ? sans : [commonName],
        issuer,
        validFrom: new Date(cert.validFrom),
        validTo: new Date(cert.validTo),
      };
    } catch (error) {
      logger.error('Failed to parse certificate:', error);
      throw new Error('Failed to parse certificate');
    }
  }
}

// Export singleton instance
export const acmeService = new AcmeService();
