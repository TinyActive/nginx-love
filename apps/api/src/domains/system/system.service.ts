import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import logger from '../../utils/logger';
import { runAlertMonitoring } from '../alerts/services/alert-monitoring.service';
import { InstallationStatus, NginxStatus, SystemMetrics } from './system.types';

const execAsync = promisify(exec);
const INSTALL_STATUS_FILE = '/var/run/nginx-modsecurity-install.status';

/**
 * System service - handles all system-related business logic
 */
export class SystemService {
  /**
   * Get installation status
   */
  async getInstallationStatus(): Promise<InstallationStatus> {
    try {
      // Check if status file exists
      const statusContent = await fs.readFile(INSTALL_STATUS_FILE, 'utf-8');
      const status = JSON.parse(statusContent);
      return status;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - check if nginx is installed
        try {
          await execAsync('which nginx');
          // Nginx exists, installation is complete
          return {
            step: 'completed',
            status: 'success',
            message: 'Nginx and ModSecurity are installed',
            timestamp: new Date().toISOString(),
          };
        } catch {
          // Nginx not installed
          return {
            step: 'pending',
            status: 'not_started',
            message: 'Installation not started',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get nginx status
   */
  async getNginxStatus(): Promise<NginxStatus> {
    try {
      const { stdout } = await execAsync('systemctl status nginx');

      return {
        running: stdout.includes('active (running)'),
        output: stdout,
      };
    } catch (error: any) {
      return {
        running: false,
        output: error.stdout || error.message,
      };
    }
  }

  /**
   * Start installation
   */
  async startInstallation(userRole: string, username: string): Promise<void> {
    // Check if user is admin
    if (userRole !== 'admin') {
      throw new Error('Only admins can start installation');
    }

    // Check if already installed
    try {
      await execAsync('which nginx');
      throw new Error('Nginx is already installed');
    } catch (error: any) {
      // If the error is not from our check, it means nginx is not installed
      if (error.message === 'Nginx is already installed') {
        throw error;
      }
      // Not installed, continue
    }

    // Start installation script in background
    const scriptPath = '/home/waf/nginx-love-ui/scripts/install-nginx-modsecurity.sh';
    exec(`sudo ${scriptPath} > /var/log/nginx-install-output.log 2>&1 &`);

    logger.info(`Installation started by user ${username}`);
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    // CPU Usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - (100 * totalIdle / totalTick);

    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Disk Usage
    let diskUsage = 0;
    try {
      const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | sed 's/%//'");
      diskUsage = parseFloat(stdout.trim());
    } catch (error) {
      logger.error('Failed to get disk usage:', error);
    }

    // Uptime
    const uptime = os.uptime();

    return {
      cpu: Math.round(cpuUsage * 10) / 10,
      memory: Math.round(memUsage * 10) / 10,
      disk: diskUsage,
      uptime: Math.round(uptime),
      totalMemory: Math.round(totalMem / (1024 * 1024 * 1024) * 100) / 100,
      freeMemory: Math.round(freeMem / (1024 * 1024 * 1024) * 100) / 100,
      cpuCount: cpus.length,
      loadAverage: os.loadavg()
    };
  }

  /**
   * Manually trigger alert monitoring check
   */
  async triggerAlertCheck(username: string): Promise<void> {
    logger.info(`User ${username} manually triggered alert monitoring check`);

    // Run monitoring immediately
    await runAlertMonitoring();
  }
}
