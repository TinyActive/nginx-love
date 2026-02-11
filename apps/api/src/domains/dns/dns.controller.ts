/**
 * DNS Management Controller
 * HTTP request handlers for DNS management (AdGuardHome + Cloudflare)
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { adguardService, cloudflareService, dnsManagementService } from './dns.service';
import type {
  AdGuardConfig,
  CloudflareConfig,
  DnsProviderConfig,
} from './dns.types';

// ============ Helper: Extract provider configs from request ============

function getAdGuardConfig(body: any): AdGuardConfig {
  const { baseUrl, username, password } = body;
  if (!baseUrl || !username || !password) {
    throw new Error('AdGuardHome configuration requires baseUrl, username, and password');
  }
  return { baseUrl, username, password };
}

function getCloudflareConfig(body: any): CloudflareConfig {
  const { apiToken, zoneId } = body;
  if (!apiToken || !zoneId) {
    throw new Error('Cloudflare configuration requires apiToken and zoneId');
  }
  return { apiToken, zoneId };
}

// ============ AdGuardHome Endpoints ============

/**
 * Get all AdGuardHome DNS rewrites
 */
export const getAdGuardRewrites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = getAdGuardConfig(req.body);
    const rewrites = await adguardService.getRewrites(config);

    res.json({
      success: true,
      data: rewrites,
    });
  } catch (error: any) {
    logger.error('Get AdGuardHome rewrites error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Add an AdGuardHome DNS rewrite
 */
export const addAdGuardRewrite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain, answer, ...configFields } = req.body;
    const config = getAdGuardConfig(configFields);

    if (!domain || !answer) {
      res.status(400).json({
        success: false,
        message: 'domain and answer are required',
      });
      return;
    }

    await adguardService.addRewrite(config, { domain, answer });

    res.status(201).json({
      success: true,
      message: 'DNS rewrite added successfully',
    });
  } catch (error: any) {
    logger.error('Add AdGuardHome rewrite error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Update an AdGuardHome DNS rewrite
 */
export const updateAdGuardRewrite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldDomain, oldAnswer, domain, answer, ...configFields } = req.body;
    const config = getAdGuardConfig(configFields);

    if (!oldDomain || !oldAnswer || !domain || !answer) {
      res.status(400).json({
        success: false,
        message: 'oldDomain, oldAnswer, domain, and answer are required',
      });
      return;
    }

    await adguardService.updateRewrite(
      config,
      { domain: oldDomain, answer: oldAnswer },
      { domain, answer }
    );

    res.json({
      success: true,
      message: 'DNS rewrite updated successfully',
    });
  } catch (error: any) {
    logger.error('Update AdGuardHome rewrite error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Delete an AdGuardHome DNS rewrite
 */
export const deleteAdGuardRewrite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { domain, answer, ...configFields } = req.body;
    const config = getAdGuardConfig(configFields);

    if (!domain || !answer) {
      res.status(400).json({
        success: false,
        message: 'domain and answer are required',
      });
      return;
    }

    await adguardService.deleteRewrite(config, { domain, answer });

    res.json({
      success: true,
      message: 'DNS rewrite deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete AdGuardHome rewrite error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// ============ Cloudflare Endpoints ============

/**
 * Get all Cloudflare DNS records
 */
export const getCloudflareRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = getCloudflareConfig(req.body);
    const records = await cloudflareService.getRecords(config);

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    logger.error('Get Cloudflare DNS records error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Create a Cloudflare DNS record
 */
export const createCloudflareRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, name, content, ttl, proxied, comment, ...configFields } = req.body;
    const config = getCloudflareConfig(configFields);

    if (!type || !name || !content) {
      res.status(400).json({
        success: false,
        message: 'type, name, and content are required',
      });
      return;
    }

    const record = await cloudflareService.createRecord(config, {
      type,
      name,
      content,
      ttl,
      proxied,
      comment,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    logger.error('Create Cloudflare DNS record error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Update a Cloudflare DNS record
 */
export const updateCloudflareRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as Record<string, string>;
    const { type, name, content, ttl, proxied, comment, ...configFields } = req.body;
    const config = getCloudflareConfig(configFields);

    const record = await cloudflareService.updateRecord(config, id, {
      type,
      name,
      content,
      ttl,
      proxied,
      comment,
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    logger.error('Update Cloudflare DNS record error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Delete a Cloudflare DNS record
 */
export const deleteCloudflareRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as Record<string, string>;
    const config = getCloudflareConfig(req.body);

    await cloudflareService.deleteRecord(config, id);

    res.json({
      success: true,
      message: 'DNS record deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete Cloudflare DNS record error:', error);
    const statusCode = error.message.includes('requires') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// ============ Unified DNS Endpoints ============

/**
 * Get all DNS records from all providers
 */
export const getAllDnsRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { configs } = req.body;

    if (!configs || !Array.isArray(configs)) {
      res.status(400).json({
        success: false,
        message: 'configs array is required',
      });
      return;
    }

    const records = await dnsManagementService.getAllRecords(configs as DnsProviderConfig[]);

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    logger.error('Get all DNS records error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Test provider connection
 */
export const testDnsConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = req.body as DnsProviderConfig;

    if (!config.provider) {
      res.status(400).json({
        success: false,
        message: 'provider is required',
      });
      return;
    }

    const connected = await dnsManagementService.testConnection(config);

    res.json({
      success: true,
      data: { connected },
    });
  } catch (error: any) {
    logger.error('Test DNS connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
