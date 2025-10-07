import api from './api';
import { SlaveNode } from '@/types';

export interface RegisterSlaveNodeRequest {
  name: string;
  host: string;
  port?: number;
  syncInterval?: number;
}

export interface UpdateSlaveNodeRequest {
  name?: string;
  host?: string;
  port?: number;
  syncEnabled?: boolean;
  syncInterval?: number;
}

export interface SyncConfigRequest {
  force?: boolean;
}

export interface SyncLog {
  id: string;
  nodeId: string;
  type: 'full_sync' | 'incremental_sync' | 'health_check';
  status: 'success' | 'failed' | 'partial' | 'running';
  configHash?: string;
  changesCount?: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface SlaveNodeWithLogs extends SlaveNode {
  syncLogs?: SyncLog[];
}

class SlaveNodeService {
  async getAll(): Promise<SlaveNode[]> {
    const response = await api.get('/slave/nodes');
    return response.data.data;
  }

  async getById(id: string): Promise<SlaveNodeWithLogs> {
    const response = await api.get(`/slave/nodes/${id}`);
    return response.data.data;
  }

  async register(data: RegisterSlaveNodeRequest) {
    console.log('SlaveNodeService.register called with:', data);

    try {
      const response = await api.post('/slave/nodes', data);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message);
      throw error;
    }
  }

  async update(id: string, data: UpdateSlaveNodeRequest) {
    const response = await api.put(`/slave/nodes/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete(`/slave/nodes/${id}`);
    return response.data;
  }

  async syncToNode(id: string, data: SyncConfigRequest = {}) {
    const response = await api.post(`/slave/nodes/${id}/sync`, data);
    return response.data;
  }

  async syncToAll() {
    const response = await api.post('/slave/nodes/sync-all', {});
    return response.data;
  }

  async getStatus(id: string) {
    const response = await api.get(`/slave/nodes/${id}/status`);
    return response.data;
  }

  async getSyncHistory(id: string, limit: number = 50) {
    const response = await api.get(`/slave/nodes/${id}/sync-history`, {
      params: { limit },
    });
    return response.data.data;
  }

  async regenerateApiKey(id: string) {
    const response = await api.post(`/slave/nodes/${id}/regenerate-key`, {});
    return response.data;
  }
}

export const slaveNodeService = new SlaveNodeService();
