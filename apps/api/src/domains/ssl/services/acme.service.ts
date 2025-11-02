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
 * Default CA: ZeroSSL (can be changed via environment variable)
 */
export class AcmeService {
  // Default CA server (ZeroSSL) - can be overridden by environment variable
  private defaultCA: string = process.env.ACME_CA_SERVER || 'zerossl';

  /**
   * Get current default CA
   */
  getDefaultCA(): string {
    return this.defaultCA;
  }

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

      // Set default CA (ZeroSSL or from environment variable)
      const caServer = this.defaultCA;
      issueCmd += ` --server ${caServer}`;
      logger.info(`Using CA server: ${caServer}`);

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

      // Check if certificate is ECC
      const eccDir = path.join(homeDir, '.acme.sh', `${domain}_ecc`);
      const isECC = fs.existsSync(eccDir);
      const certDir = isECC ? eccDir : path.join(homeDir, '.acme.sh', domain);
      
      // Build renewal command (without --force to respect rate limits)
      let renewCmd = `${acmeScript} --renew -d ${domain}`;
      if (isECC) {
        renewCmd += ' --ecc';
      }

      logger.info(`Running: ${renewCmd}`);

      const { stdout, stderr } = await execAsync(renewCmd);
      logger.info(`acme.sh renew output: ${stdout}`);

      if (stderr) {
        logger.warn(`acme.sh renew stderr: ${stderr}`);
      }

      // Get renewed certificate files

      const certFileName = isECC ? `${domain}.cer` : `${domain}.cer`;
      const keyFileName = isECC ? `${domain}.key` : `${domain}.key`;
      
      const certificate = await fs.promises.readFile(path.join(certDir, certFileName), 'utf8');
      const privateKey = await fs.promises.readFile(path.join(certDir, keyFileName), 'utf8');
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
      // Check if error is due to rate limiting
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('retryafter') || errorMsg.includes('too large')) {
        logger.warn(`Certificate renewal rate limited for ${domain}, will retry later`);
        throw new Error(`Rate limited by CA, will retry in next cycle`);
      }
      
      // Check if certificate is not due for renewal yet
      if (errorMsg.includes('not due for renewal') || errorMsg.includes('Skip')) {
        logger.info(`Certificate for ${domain} is not yet due for renewal`);
        throw new Error(`Certificate not yet due for renewal`);
      }
      
      logger.error('Failed to renew certificate:', error);
      throw new Error(`Failed to renew certificate: ${error.message}`);
    }
  }

  /**
   * Validate that private key matches certificate
   */
  async validateKeyPair(certificate: string, privateKey: string): Promise<boolean> {
    try {
      const forge = await import('node-forge');
      
      // Parse certificate and private key
      const cert = forge.pki.certificateFromPem(certificate);
      let privKey;
      
      try {
        privKey = forge.pki.privateKeyFromPem(privateKey);
      } catch (error) {
        // Try RSA format
        try {
          privKey = forge.pki.privateKeyFromPem(privateKey);
        } catch {
          throw new Error('Invalid private key format');
        }
      }

      // Get public key from certificate
      const certPublicKey = cert.publicKey as any;
      
      // Compare modulus for RSA keys (simplified validation)
      if (certPublicKey.n && (privKey as any).n) {
        const certModulus = (certPublicKey.n as any).toString(16);
        const keyModulus = ((privKey as any).n as any).toString(16);
        return certModulus === keyModulus;
      }

      // For other key types, we'll let nginx validation handle it
      return true;
    } catch (error) {
      logger.warn('Key pair validation failed, will rely on nginx validation:', error);
      // Return true to allow nginx to validate - this is a best-effort check
      return true;
    }
  }

  /**
   * Parse certificate to extract information using node-forge
   */
  async parseCertificate(certContent: string): Promise<ParsedCertificate> {
    try {
      // Try node-forge first (works with RSA)
      try {
        const forge = await import('node-forge');
        const cert = forge.pki.certificateFromPem(certContent);

      // Helper function to extract string value from attribute
      const getAttrValue = (attrs: any[], attrName: string): string | undefined => {
        const value = attrs.find((attr: any) => attr.name === attrName)?.value;
        return Array.isArray(value) ? value[0] : value;
      };

      // Extract subject details
      const subjectAttrs = cert.subject.attributes;
      const subjectCN = getAttrValue(subjectAttrs, 'commonName') || '';
      const subjectO = getAttrValue(subjectAttrs, 'organizationName');
      const subjectC = getAttrValue(subjectAttrs, 'countryName');

      // Extract issuer details
      const issuerAttrs = cert.issuer.attributes;
      const issuerCN = getAttrValue(issuerAttrs, 'commonName') || '';
      const issuerO = getAttrValue(issuerAttrs, 'organizationName');
      const issuerC = getAttrValue(issuerAttrs, 'countryName');

      // Build subject and issuer strings
      const subject = cert.subject.attributes
        .map((attr: any) => `${attr.shortName}=${attr.value}`)
        .join(', ');
      
      const issuer = cert.issuer.attributes
        .map((attr: any) => `${attr.shortName}=${attr.value}`)
        .join(', ');

      // Extract SANs from extensions
      const sans: string[] = [];
      const sanExtension = cert.extensions.find((ext: any) => ext.name === 'subjectAltName');
      
      if (sanExtension && sanExtension.altNames) {
        sanExtension.altNames.forEach((altName: any) => {
          if (altName.type === 2) { // DNS type
            sans.push(altName.value);
          }
        });
      }

      // If no SANs found, use CN
      if (sans.length === 0 && subjectCN) {
        sans.push(subjectCN);
      }

      // Extract serial number
      const serialNumber = cert.serialNumber;

      // Extract validity dates
      const validFrom = new Date(cert.validity.notBefore);
      const validTo = new Date(cert.validity.notAfter);

      logger.info(`Certificate parsed: CN=${subjectCN}, Issuer=${issuerCN}, Valid: ${validFrom.toISOString()} - ${validTo.toISOString()}`);

      return {
        commonName: subjectCN,
        sans,
        issuer: issuerO || issuerCN,
        issuerDetails: {
          commonName: issuerCN,
          organization: issuerO,
          country: issuerC,
        },
        subject: subjectCN,
        subjectDetails: {
          commonName: subjectCN,
          organization: subjectO,
          country: subjectC,
        },
        validFrom,
        validTo,
        serialNumber,
      };
      } catch (forgeError: any) {
        // If node-forge fails (e.g., EC certificate), fallback to native crypto
        logger.info('node-forge failed, trying native X509Certificate (EC support)');
        
        const { X509Certificate } = await import('crypto');
        const cert = new X509Certificate(certContent);

        const commonName = cert.subject.split('\n').find(line => line.startsWith('CN='))?.replace('CN=', '') || '';
        const issuerCN = cert.issuer.split('\n').find(line => line.startsWith('CN='))?.replace('CN=', '') || '';
        const issuerO = cert.issuer.split('\n').find(line => line.startsWith('O='))?.replace('O=', '');
        const issuerC = cert.issuer.split('\n').find(line => line.startsWith('C='))?.replace('C=', '');
        
        const subjectO = cert.subject.split('\n').find(line => line.startsWith('O='))?.replace('O=', '');
        const subjectC = cert.subject.split('\n').find(line => line.startsWith('C='))?.replace('C=', '');

        // Parse SANs from subjectAltName
        const sans: string[] = [];
        const sanMatch = cert.subjectAltName?.match(/DNS:([^,]+)/g);
        if (sanMatch) {
          sanMatch.forEach(san => {
            const domain = san.replace('DNS:', '');
            if (domain) sans.push(domain);
          });
        }
        
        if (sans.length === 0 && commonName) {
          sans.push(commonName);
        }

        const validFrom = new Date(cert.validFrom);
        const validTo = new Date(cert.validTo);
        
        logger.info(`Certificate parsed (EC): CN=${commonName}, Valid: ${validFrom.toISOString()} - ${validTo.toISOString()}`);

        return {
          commonName,
          sans,
          issuer: issuerO || issuerCN || 'Unknown',
          issuerDetails: {
            commonName: issuerCN,
            organization: issuerO,
            country: issuerC,
          },
          subject: commonName,
          subjectDetails: {
            commonName,
            organization: subjectO,
            country: subjectC,
          },
          validFrom,
          validTo,
          serialNumber: cert.serialNumber,
        };
      }
    } catch (error) {
      logger.error('Failed to parse certificate:', error);
      throw new Error('Failed to parse certificate');
    }
  }
}

// Export singleton instance
export const acmeService = new AcmeService();
