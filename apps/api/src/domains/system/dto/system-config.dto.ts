/**
 * System configuration DTOs
 */

/**
 * Update node mode DTO
 */
export interface UpdateNodeModeDto {
  nodeMode: 'master' | 'slave';
}

/**
 * Connect to master DTO
 */
export interface ConnectToMasterDto {
  masterHost: string;
  masterPort: number;
  masterApiKey: string;
}

/**
 * System config response DTO
 */
export interface SystemConfigDto {
  id: string;
  nodeMode: 'master' | 'slave';
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

/**
 * Master connection test response DTO
 */
export interface MasterConnectionTestDto {
  success: boolean;
  message: string;
  data?: {
    latency: number;
    masterVersion: string;
    masterStatus: string;
  };
}

/**
 * Sync response DTO
 */
export interface SyncWithMasterDto {
  imported: boolean;
  masterHash: string;
  slaveHash: string | null;
  changesApplied: number;
  details?: any;
  lastSyncAt: string;
}
