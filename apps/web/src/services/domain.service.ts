import api from './api';
import {  Domain, Upstream, LoadBalancerConfig, Pagination, ApiResponse } from '@/types';

export interface CreateDomainRequest {
  name: string;
  modsecEnabled?: boolean;
  upstreams: {
    host: string;
    port: number;
    weight?: number;
    maxFails?: number;
    failTimeout?: number;
  }[];
  loadBalancer?: {
    algorithm?: 'round_robin' | 'least_conn' | 'ip_hash';
    healthCheckEnabled?: boolean;
    healthCheckInterval?: number;
    healthCheckTimeout?: number;
    healthCheckPath?: string;
  };
}

export interface UpdateDomainRequest {
  name?: string;
  status?: 'active' | 'inactive' | 'error';
  modsecEnabled?: boolean;
  upstreams?: {
    host: string;
    port: number;
    weight?: number;
    maxFails?: number;
    failTimeout?: number;
  }[];
  loadBalancer?: {
    algorithm?: 'round_robin' | 'least_conn' | 'ip_hash';
    healthCheckEnabled?: boolean;
    healthCheckInterval?: number;
    healthCheckTimeout?: number;
    healthCheckPath?: string;
  };
}

/**
 * Get all domains with search and pagination
 */
export const getDomains = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sslEnabled?: boolean;
  modsecEnabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ data: Domain[]; pagination: Pagination }> => {
  const response = await api.get<{ success: boolean; data: Domain[]; pagination: Pagination }>('/domains', { params });
  
  // Extract the actual data from the API response
  const { data, pagination } = response.data;
  
  return { data, pagination };
};

/**
 * Get domain by ID
 */
export const getDomainById = async (id: string): Promise<Domain> => {
  const response = await api.get<{ success: boolean; data: Domain }>(`/domains/${id}`);
  
  // Extract the actual data from the API response
  const domain = response.data.data;
  
  return domain;
};

/**
 * Create new domain
 */
export const createDomain = async (data: CreateDomainRequest): Promise<Domain> => {
  const response = await api.post<{ success: boolean; message: string; data: Domain }>('/domains', data);
  
  // Extract the actual data from the API response
  const domain = response.data.data;
  
  return domain;
};

/**
 * Update domain
 */
export const updateDomain = async (id: string, data: UpdateDomainRequest): Promise<Domain> => {
  const response = await api.put<{ success: boolean; message: string; data: Domain }>(`/domains/${id}`, data);
  
  // Extract the actual data from the API response
  const domain = response.data.data;
  
  return domain;
};

/**
 * Delete domain
 */
export const deleteDomain = async (id: string): Promise<void> => {
  await api.delete(`/domains/${id}`);
};

/**
 * Toggle SSL for domain
 */
export const toggleSSL = async (id: string, sslEnabled: boolean): Promise<Domain> => {
  const response = await api.post<{ success: boolean; message: string; data: Domain }>(`/domains/${id}/toggle-ssl`, { sslEnabled });
  
  // Extract the actual data from the API response
  const domain = response.data.data;
  
  return domain;
};

/**
 * Reload nginx configuration
 */
export const reloadNginx = async (): Promise<void> => {
  await api.post('/domains/nginx/reload');
};

/**
 * Get installation status
 */
export const getInstallationStatus = async (): Promise<any> => {
  try {
    const response = await api.get('/system/installation-status');
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

// Export as object for easier import
export const domainService = {
  getAll: getDomains,
  getById: getDomainById,
  create: createDomain,
  update: updateDomain,
  delete: deleteDomain,
  toggleSSL,
  reloadNginx,
  getInstallationStatus,
};
