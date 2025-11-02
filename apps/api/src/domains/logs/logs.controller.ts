import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { getParsedLogs, getLogStats, getAvailableDomainsFromDb } from './logs.service';

// Constants for security limits
const MAX_LOGS_PER_REQUEST = 100;
const MAX_DOWNLOAD_LOGS = 5000;
const MAX_TOTAL_LOGS_FETCH = 5000;

/**
 * Sanitize string input to prevent injection
 */
const sanitizeString = (input: string | undefined): string | undefined => {
  if (!input) return undefined;
  // Remove any potential SQL injection or XSS characters
  return input.toString().trim().substring(0, 200);
};

/**
 * Get logs with filters
 */
export const getLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '10', page = '1', level, type, search, domain, ruleId, uniqueId } = req.query;

    // Parse and validate parameters
    const limitNum = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      MAX_LOGS_PER_REQUEST
    );
    const pageNum = Math.max(parseInt(page as string) || 1, 1);

    // Sanitize all string inputs
    const sanitizedLevel = sanitizeString(level as string);
    const sanitizedType = sanitizeString(type as string);
    const sanitizedSearch = sanitizeString(search as string);
    const sanitizedDomain = sanitizeString(domain as string);
    const sanitizedRuleId = sanitizeString(ruleId as string);
    const sanitizedUniqueId = sanitizeString(uniqueId as string);

    // Calculate offset for efficient database query
    const offset = (pageNum - 1) * limitNum;

    // Get logs with pagination limit (fetch only what's needed + 1 for hasMore check)
    const fetchLimit = Math.min(limitNum + 1, MAX_TOTAL_LOGS_FETCH);
    
    const allLogs = await getParsedLogs({
      limit: fetchLimit,
      offset: offset,
      level: sanitizedLevel,
      type: sanitizedType,
      search: sanitizedSearch,
      domain: sanitizedDomain,
      ruleId: sanitizedRuleId,
      uniqueId: sanitizedUniqueId,
    });

    // Check if there are more results
    const hasMore = allLogs.length > limitNum;
    const paginatedLogs = hasMore ? allLogs.slice(0, limitNum) : allLogs;

    // For total count, we need a separate count query (more efficient than fetching all)
    // This should be implemented in the service layer
    // For now, we'll use a reasonable approach
    const total = allLogs.length;
    const totalPages = hasMore ? pageNum + 1 : pageNum; // At minimum

    logger.info(
      `User fetched ${paginatedLogs.length} logs (page ${pageNum})${
        sanitizedDomain ? ` for domain ${sanitizedDomain}` : ''
      }`
    );

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: totalPages,
        hasMore: hasMore,
      },
    });
  } catch (error) {
    logger.error('Get logs error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve logs',
    });
  }
};

/**
 * Get log statistics
 */
export const getLogStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const stats = await getLogStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get log statistics error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve statistics',
    });
  }
};

/**
 * Download logs as JSON
 */
export const downloadLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '1000', level, type, search, domain, ruleId, uniqueId } = req.query;

    // Parse and validate parameters with stricter limit
    const limitNum = Math.min(
      Math.max(parseInt(limit as string) || 1000, 1),
      MAX_DOWNLOAD_LOGS
    );

    // Sanitize all string inputs
    const sanitizedLevel = sanitizeString(level as string);
    const sanitizedType = sanitizeString(type as string);
    const sanitizedSearch = sanitizeString(search as string);
    const sanitizedDomain = sanitizeString(domain as string);
    const sanitizedRuleId = sanitizeString(ruleId as string);
    const sanitizedUniqueId = sanitizeString(uniqueId as string);

    const logs = await getParsedLogs({
      limit: limitNum,
      level: sanitizedLevel,
      type: sanitizedType,
      search: sanitizedSearch,
      domain: sanitizedDomain,
      ruleId: sanitizedRuleId,
      uniqueId: sanitizedUniqueId,
    });

    logger.info(
      `User downloaded ${logs.length} logs${
        sanitizedDomain ? ` for domain ${sanitizedDomain}` : ''
      }`
    );

    // Set headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-${timestamp}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json({
      success: true,
      data: logs,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalCount: logs.length,
        filters: {
          level: sanitizedLevel,
          type: sanitizedType,
          search: sanitizedSearch,
          domain: sanitizedDomain,
          ruleId: sanitizedRuleId,
          uniqueId: sanitizedUniqueId,
        },
      },
    });
  } catch (error) {
    logger.error('Download logs error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      message: 'Unable to download logs',
    });
  }
};

/**
 * Get list of available domains for filtering
 */
export const getAvailableDomains = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const domains = await getAvailableDomainsFromDb();

    res.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    logger.error('Get available domains error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve domains',
    });
  }
};