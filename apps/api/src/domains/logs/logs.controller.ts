import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { getParsedLogs, getLogStats, getAvailableDomainsFromDb } from './logs.service';

/**
 * Get logs with filters
 */
export const getLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit = '10', page = '1', level, type, search, domain } = req.query;

    // Parse and validate parameters
    const limitNum = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      100
    ); // Between 1 and 100
    const pageNum = Math.max(parseInt(page as string) || 1, 1); // At least 1

    // Get all logs first to calculate total
    const allLogs = await getParsedLogs({
      limit: 10000, // Get a large number to calculate total
      level: level as string,
      type: type as string,
      search: search as string,
      domain: domain as string,
    });

    // Calculate pagination info
    const total = allLogs.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // Get the paginated logs by slicing the allLogs array
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    logger.info(
      `User ${req.user?.username} fetched ${
        paginatedLogs.length
      } logs (page ${pageNum})${domain ? ` for domain ${domain}` : ''}`
    );

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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
    logger.error('Get log statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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
    const { limit = '1000', level, type, search, domain } = req.query;

    // Parse and validate parameters
    const limitNum = Math.min(
      Math.max(parseInt(limit as string) || 1000, 1),
      10000
    ); // Between 1 and 10000

    const logs = await getParsedLogs({
      limit: limitNum,
      level: level as string,
      type: type as string,
      search: search as string,
      domain: domain as string,
    });

    logger.info(
      `User ${req.user?.username} downloaded ${logs.length} logs${
        domain ? ` for domain ${domain}` : ''
      }`
    );

    // Set headers for file download
    const filename = `logs-${new Date().toISOString()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json({
      success: true,
      data: logs,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user?.username,
        totalCount: logs.length,
        filters: {
          level,
          type,
          search,
          domain,
        },
      },
    });
  } catch (error) {
    logger.error('Download logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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
    logger.error('Get available domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
