/**
 * System domain type definitions
 */

/**
 * Installation status step
 */
export type InstallationStep = 'pending' | 'installing' | 'completed' | 'failed';

/**
 * Installation status
 */
export type InstallationStatusType = 'not_started' | 'in_progress' | 'success' | 'failed';

/**
 * Installation status data
 */
export interface InstallationStatus {
  step: string;
  status: InstallationStatusType;
  message: string;
  timestamp: string;
}

/**
 * Nginx status data
 */
export interface NginxStatus {
  running: boolean;
  output: string;
}

/**
 * System metrics data
 */
export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
  loadAverage: number[];
}

/**
 * Alert check trigger response
 */
export interface AlertCheckTriggerResponse {
  success: boolean;
  message: string;
}

/**
 * Node mode type
 */
export type NodeMode = 'master' | 'slave';

/**
 * System configuration type
 */
export interface SystemConfig {
  id: string;
  nodeMode: NodeMode;
  masterApiEnabled: boolean;
  slaveApiEnabled: boolean;
  masterHost: string | null;
  masterPort: number | null;
  masterApiKey: string | null;
  syncInterval: number;
  lastSyncHash: string | null;
  connected: boolean;
  lastConnectedAt: Date | null;
  connectionError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
