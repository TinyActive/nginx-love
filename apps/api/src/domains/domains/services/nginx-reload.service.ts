import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../../utils/logger';
import { NginxReloadResult, EnvironmentInfo } from '../domains.types';

const execAsync = promisify(exec);

/**
 * Service for reloading Nginx configuration
 */
export class NginxReloadService {
  /**
   * Detect environment (container vs host)
   */
  private detectEnvironment(): EnvironmentInfo {
    const isContainer =
      process.env.NODE_ENV === 'development' ||
      process.env.CONTAINERIZED === 'true';

    return {
      isContainer,
      nodeEnv: process.env.NODE_ENV || 'production',
    };
  }

  /**
   * Test nginx configuration
   */
  private async testConfig(): Promise<{ success: boolean; error?: string }> {
    try {
      await execAsync('nginx -t');
      logger.info('Nginx configuration test passed');
      return { success: true };
    } catch (error: any) {
      logger.error('Nginx configuration test failed:', error.stderr);
      return { success: false, error: error.stderr };
    }
  }

  /**
   * Verify nginx is running
   */
  private async verifyRunning(isContainer: boolean): Promise<boolean> {
    try {
      if (isContainer) {
        const { stdout } = await execAsync(
          'pgrep nginx > /dev/null && echo "running" || echo "not running"'
        );
        return stdout.trim() === 'running';
      } else {
        const { stdout } = await execAsync('systemctl is-active nginx');
        return stdout.trim() === 'active';
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempt graceful reload
   */
  private async attemptReload(isContainer: boolean): Promise<boolean> {
    try {
      if (isContainer) {
        logger.info('Attempting graceful nginx reload (container mode)...');
        await execAsync('nginx -s reload');
      } else {
        logger.info('Attempting graceful nginx reload (host mode)...');
        await execAsync('systemctl reload nginx');
      }

      // Wait for reload to take effect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify nginx is still running
      const isRunning = await this.verifyRunning(isContainer);

      if (isRunning) {
        logger.info(
          `Nginx reloaded successfully (${isContainer ? 'container' : 'host'} mode)`
        );
        return true;
      }

      return false;
    } catch (error: any) {
      logger.warn('Graceful reload failed:', error.message);
      return false;
    }
  }

  /**
   * Attempt restart
   */
  private async attemptRestart(isContainer: boolean): Promise<boolean> {
    try {
      if (isContainer) {
        logger.info('Restarting nginx (container mode)...');
        // Check if nginx is running
        try {
          await execAsync('pgrep nginx');
          // If running, try to stop and start
          await execAsync('nginx -s stop');
          await new Promise((resolve) => setTimeout(resolve, 500));
          await execAsync('nginx');
        } catch (e) {
          // If not running, just start it
          await execAsync('nginx');
        }
      } else {
        logger.info('Restarting nginx (host mode)...');
        await execAsync('systemctl restart nginx');
      }

      // Wait for restart to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify nginx started
      const isRunning = await this.verifyRunning(isContainer);

      if (!isRunning) {
        throw new Error(
          `Nginx failed to start after restart (${isContainer ? 'container' : 'host'} mode)`
        );
      }

      logger.info(
        `Nginx restarted successfully (${isContainer ? 'container' : 'host'} mode)`
      );
      return true;
    } catch (error: any) {
      logger.error('Nginx restart failed:', error);
      throw error;
    }
  }

  /**
   * Auto reload nginx with smart retry logic
   * @param silent - If true, don't throw errors, just log them
   */
  async autoReload(silent: boolean = false): Promise<boolean> {
    try {
      const env = this.detectEnvironment();
      logger.info(
        `Environment check - Container: ${env.isContainer}, Node Env: ${env.nodeEnv}`
      );

      // Test nginx configuration first
      const configTest = await this.testConfig();
      if (!configTest.success) {
        if (!silent) {
          throw new Error(`Nginx config test failed: ${configTest.error}`);
        }
        return false;
      }

      // Try graceful reload first
      const reloadSuccess = await this.attemptReload(env.isContainer);
      if (reloadSuccess) {
        return true;
      }

      // Fallback to restart
      logger.warn('Graceful reload failed, trying restart...');
      await this.attemptRestart(env.isContainer);
      return true;
    } catch (error: any) {
      logger.error('Auto reload nginx failed:', error);
      if (!silent) throw error;
      return false;
    }
  }

  /**
   * Reload nginx configuration with smart retry logic
   * Used by the manual reload endpoint
   */
  async reload(): Promise<NginxReloadResult> {
    try {
      const env = this.detectEnvironment();
      logger.info(
        `[reloadNginx] Environment check - Container: ${env.isContainer}, Node Env: ${env.nodeEnv}`
      );

      // Test nginx configuration first
      const configTest = await this.testConfig();
      if (!configTest.success) {
        return {
          success: false,
          error: `Nginx configuration test failed: ${configTest.error}`,
        };
      }

      // Try graceful reload first
      const reloadSuccess = await this.attemptReload(env.isContainer);

      if (reloadSuccess) {
        return {
          success: true,
          method: 'reload',
          mode: env.isContainer ? 'container' : 'host',
        };
      }

      // Fallback to restart
      logger.info('[reloadNginx] Falling back to nginx restart...');
      await this.attemptRestart(env.isContainer);

      return {
        success: true,
        method: 'restart',
        mode: env.isContainer ? 'container' : 'host',
      };
    } catch (error: any) {
      logger.error('[reloadNginx] Reload nginx error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reload nginx',
      };
    }
  }
}

// Export singleton instance
export const nginxReloadService = new NginxReloadService();
