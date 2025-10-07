import logger from '../../../utils/logger';
import { ClusterRepository } from '../cluster.repository';

/**
 * Slave Status Checker Service
 * Monitors slave node health and marks stale nodes as offline
 */
export class SlaveStatusCheckerService {
  private repository: ClusterRepository;

  constructor() {
    this.repository = new ClusterRepository();
  }

  /**
   * Check slave nodes and mark as offline if not seen for 5 minutes
   */
  async checkSlaveNodeStatus(): Promise<void> {
    try {
      const staleNodes = await this.repository.findStaleNodes(5);

      if (staleNodes.length > 0) {
        logger.info('[SLAVE-STATUS] Marking stale nodes as offline', {
          count: staleNodes.length,
          nodes: staleNodes.map(n => n.name)
        });

        // Update to offline
        await this.repository.markNodesOffline(staleNodes.map(n => n.id));
      }
    } catch (error: any) {
      logger.error('[SLAVE-STATUS] Check slave status error:', error);
    }
  }
}

// Singleton instance
export const slaveStatusCheckerService = new SlaveStatusCheckerService();

/**
 * Start background job to check slave node status every 1 minute
 */
export function startSlaveNodeStatusCheck(): NodeJS.Timeout {
  logger.info('[SLAVE-STATUS] Starting slave node status checker (interval: 60s)');

  // Run immediately on start
  slaveStatusCheckerService.checkSlaveNodeStatus();

  // Then run every minute
  return setInterval(() => slaveStatusCheckerService.checkSlaveNodeStatus(), 60 * 1000);
}

/**
 * Stop background job
 */
export function stopSlaveNodeStatusCheck(timer: NodeJS.Timeout): void {
  logger.info('[SLAVE-STATUS] Stopping slave node status checker');
  clearInterval(timer);
}
