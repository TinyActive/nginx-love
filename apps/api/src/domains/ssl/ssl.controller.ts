import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { validationResult } from 'express-validator';
import { sslService } from './ssl.service';
import { IssueAutoSSLDto, UploadManualSSLDto, UpdateSSLDto, IssueWildcardSSLDto, UploadWildcardSSLDto, ApplyWildcardSSLDto } from './dto';
import { acmeService } from './services/acme.service';

/**
 * Get SSL system information (CA server, etc.)
 */
export const getSSLSystemInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const defaultCA = acmeService.getDefaultCA();
    const isAcmeInstalled = await acmeService.isAcmeInstalled();

    res.json({
      success: true,
      data: {
        defaultCA,
        caServerOptions: ['zerossl', 'letsencrypt'],
        isAcmeInstalled,
        supportedIssuers: ['ZeroSSL', "Let's Encrypt"],
      },
    });
  } catch (error) {
    logger.error('Get SSL system info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all SSL certificates
 */
export const getSSLCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const certificates = await sslService.getAllCertificates();

    res.json({
      success: true,
      data: certificates,
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
    const { id } = req.params as Record<string, string>;

    const certificate = await sslService.getCertificateById(id);

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
 * Issue ZeroSSL/Let's Encrypt certificate (auto)
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

    const dto: IssueAutoSSLDto = {
      domainId: req.body.domainId,
      email: req.body.email,
      autoRenew: req.body.autoRenew ?? true,
    };

    try {
      const sslCertificate = await sslService.issueAutoCertificate(
        dto,
        req.user!.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(201).json({
        success: true,
        message: 'SSL certificate issued successfully',
        data: sslCertificate,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('already exists') || error.message.includes('Invalid email')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
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

    const dto: UploadManualSSLDto = {
      domainId: req.body.domainId,
      certificate: req.body.certificate,
      privateKey: req.body.privateKey,
      chain: req.body.chain,
      issuer: req.body.issuer,
    };

    try {
      const cert = await sslService.uploadManualCertificate(
        dto,
        req.user!.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(201).json({
        success: true,
        message: 'SSL certificate uploaded successfully',
        data: cert,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('already exists') || error.message.includes('Use update endpoint')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
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

    const { id } = req.params as Record<string, string>;
    const dto: UpdateSSLDto = {
      certificate: req.body.certificate,
      privateKey: req.body.privateKey,
      chain: req.body.chain,
      autoRenew: req.body.autoRenew,
    };

    try {
      const updatedCert = await sslService.updateCertificate(
        id,
        dto,
        req.user!.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'SSL certificate updated successfully',
        data: updatedCert,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
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
    const { id } = req.params as Record<string, string>;

    try {
      await sslService.deleteCertificate(
        id,
        req.user!.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'SSL certificate deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
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
    const { id } = req.params as Record<string, string>;

    try {
      const updatedCert = await sslService.renewCertificate(
        id,
        req.user!.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.json({
        success: true,
        message: 'SSL certificate renewed successfully',
        data: updatedCert,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('Only Let')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (error.message.includes('not yet eligible')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  } catch (error) {
    logger.error('Renew SSL certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Trigger automated wildcard SSL issuance through ACME DNS-01 verification
 */
export const issueWildcardSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ success: false, errors: validationErrors.array() });
      return;
    }

    const payload: IssueWildcardSSLDto = {
      domainId: req.body.domainId,
      baseDomain: req.body.baseDomain,
      email: req.body.email,
      dnsProvider: req.body.dnsProvider,
      dnsCredentials: req.body.dnsCredentials,
      autoRenew: req.body.autoRenew ?? true,
    };

    const result = await sslService.requestWildcardViaAcme(
      payload,
      req.user!.userId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    res.status(201).json({
      success: true,
      message: 'Wildcard SSL certificate issued successfully',
      data: result,
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
    } else if (msg.includes('already exists') || msg.includes('not recognized')) {
      res.status(400).json({ success: false, message: msg });
    } else {
      logger.error('[WildcardCtrl] Issue error:', err);
      res.status(500).json({ success: false, message: msg || 'Internal server error' });
    }
  }
};

/**
 * Accept a manually uploaded wildcard PEM certificate
 */
export const uploadWildcardSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ success: false, errors: validationErrors.array() });
      return;
    }

    const payload: UploadWildcardSSLDto = {
      domainId: req.body.domainId,
      certificate: req.body.certificate,
      privateKey: req.body.privateKey,
      chain: req.body.chain,
      issuer: req.body.issuer,
      additionalDomainIds: req.body.additionalDomainIds,
    };

    const result = await sslService.ingestWildcardUpload(
      payload,
      req.user!.userId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    res.status(201).json({
      success: true,
      message: 'Wildcard SSL certificate uploaded successfully',
      data: result,
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('not found') || msg.includes('does not exist')) {
      res.status(404).json({ success: false, message: msg });
    } else if (msg.includes('already exists') || msg.includes('not wildcard') || msg.includes('does not cover')) {
      res.status(400).json({ success: false, message: msg });
    } else {
      logger.error('[WildcardCtrl] Upload error:', err);
      res.status(500).json({ success: false, message: msg || 'Internal server error' });
    }
  }
};

/**
 * Spread an existing wildcard cert to additional domains
 */
export const applyWildcardSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ success: false, errors: validationErrors.array() });
      return;
    }

    const payload: ApplyWildcardSSLDto = {
      certificateId: req.body.certificateId,
      targetDomainIds: req.body.targetDomainIds,
    };

    const applied = await sslService.spreadWildcardToDomains(
      payload,
      req.user!.userId,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    );

    res.status(201).json({
      success: true,
      message: `Wildcard cert applied to ${applied.length} domain(s)`,
      data: applied,
    });
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('not found')) {
      res.status(404).json({ success: false, message: msg });
    } else if (msg.includes('not a wildcard') || msg.includes('does not cover')) {
      res.status(400).json({ success: false, message: msg });
    } else {
      logger.error('[WildcardCtrl] Apply error:', err);
      res.status(500).json({ success: false, message: msg || 'Internal server error' });
    }
  }
};

/**
 * Check wildcard certificate coverage against a list of domain names
 */
export const validateWildcardSSL = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ success: false, errors: validationErrors.array() });
      return;
    }

    const { certificate, domainNames } = req.body;
    const report = await sslService.checkWildcardCoverage(certificate, domainNames);

    res.json({ success: true, data: report });
  } catch (err: any) {
    logger.error('[WildcardCtrl] Validate error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * Retrieve all wildcard-type SSL certificates
 */
export const getWildcardCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wildcardCerts = await sslService.listWildcardCerts();
    res.json({ success: true, data: wildcardCerts });
  } catch (err) {
    logger.error('[WildcardCtrl] List error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
