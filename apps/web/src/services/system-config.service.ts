import api from './api';
import { SystemConfig, ApiResponse } from '@/types';

export const systemConfigService = {
  /**
   * Get system configuration
   */
  getConfig: async (): Promise<ApiResponse<SystemConfig>> => {
    const response = await api.get('/system-config');
    return response.data;
  },

  /**
   * Update node mode (master or slave)
   */
  updateNodeMode: async (nodeMode: 'master' | 'slave'): Promise<ApiResponse<SystemConfig>> => {
    const response = await api.put('/system-config/node-mode', { nodeMode });
    return response.data;
  },

  /**
   * Connect to master node (for slave mode)
   */
  connectToMaster: async (params: {
    masterHost: string;
    masterPort: number;
    masterApiKey: string;
    syncInterval?: number;
  }): Promise<ApiResponse<SystemConfig>> => {
    const response = await api.post('/system-config/connect-master', params);
    return response.data;
  },

  /**
   * Disconnect from master node
   */
  disconnectFromMaster: async (): Promise<ApiResponse<SystemConfig>> => {
    const response = await api.post('/system-config/disconnect-master', {});
    return response.data;
  },

  /**
   * Test connection to master
   */
  testMasterConnection: async (): Promise<ApiResponse<{
    latency: number;
    masterVersion: string;
    masterStatus: string;
  }>> => {
    const response = await api.post('/system-config/test-master-connection', {});
    return response.data;
  },

  /**
   * Sync configuration from master (slave pulls config)
   */
  syncWithMaster: async (): Promise<ApiResponse<{
    changesApplied: number;
    lastSyncAt: string;
  }>> => {
    const response = await api.post('/system-config/sync', {});
    return response.data;
  },
};
