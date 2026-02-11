import api from './api';
import { SSLCertificate, WildcardValidationResult } from '@/types';

export interface IssueAutoSSLRequest {
  domainId: string;
  email?: string;
  autoRenew?: boolean;
}

export interface UploadManualSSLRequest {
  domainId: string;
  certificate: string;
  privateKey: string;
  chain?: string;
  issuer?: string;
}

export interface UpdateSSLRequest {
  certificate?: string;
  privateKey?: string;
  chain?: string;
  autoRenew?: boolean;
}

export interface IssueWildcardSSLRequest {
  domainId: string;
  baseDomain: string;
  email?: string;
  dnsProvider: string;
  dnsCredentials?: Record<string, string>;
  autoRenew?: boolean;
}

export interface UploadWildcardSSLRequest {
  domainId: string;
  certificate: string;
  privateKey: string;
  chain?: string;
  issuer?: string;
  additionalDomainIds?: string[];
}

export interface ApplyWildcardSSLRequest {
  certificateId: string;
  targetDomainIds: string[];
}

export interface ValidateWildcardSSLRequest {
  certificate: string;
  domainNames: string[];
}

export const sslService = {
  /**
   * Get all SSL certificates
   */
  async getAll(): Promise<SSLCertificate[]> {
    const response = await api.get('/ssl');
    return response.data.data;
  },

  /**
   * Get single SSL certificate by ID
   */
  async getById(id: string): Promise<SSLCertificate> {
    const response = await api.get(`/ssl/${id}`);
    return response.data.data;
  },

  /**
   * Issue Let's Encrypt certificate (auto)
   */
  async issueAuto(data: IssueAutoSSLRequest): Promise<SSLCertificate> {
    const response = await api.post('/ssl/auto', data);
    return response.data.data;
  },

  /**
   * Upload manual SSL certificate
   */
  async uploadManual(data: UploadManualSSLRequest): Promise<SSLCertificate> {
    const response = await api.post('/ssl/manual', data);
    return response.data.data;
  },

  /**
   * Update SSL certificate
   */
  async update(id: string, data: UpdateSSLRequest): Promise<SSLCertificate> {
    const response = await api.put(`/ssl/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete SSL certificate
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/ssl/${id}`);
  },

  /**
   * Renew SSL certificate
   */
  async renew(id: string): Promise<SSLCertificate> {
    const response = await api.post(`/ssl/${id}/renew`);
    return response.data.data;
  },

  /**
   * Get all wildcard SSL certificates
   */
  async getWildcardCertificates(): Promise<SSLCertificate[]> {
    const response = await api.get('/ssl/wildcard');
    return response.data.data;
  },

  /**
   * Issue wildcard SSL certificate via ACME DNS-01 challenge
   */
  async issueWildcard(data: IssueWildcardSSLRequest): Promise<SSLCertificate> {
    const response = await api.post('/ssl/wildcard/auto', data);
    return response.data.data;
  },

  /**
   * Upload manual wildcard SSL certificate
   */
  async uploadWildcard(data: UploadWildcardSSLRequest): Promise<SSLCertificate> {
    const response = await api.post('/ssl/wildcard/manual', data);
    return response.data.data;
  },

  /**
   * Apply wildcard SSL certificate to additional domains
   */
  async applyWildcard(data: ApplyWildcardSSLRequest): Promise<SSLCertificate[]> {
    const response = await api.post('/ssl/wildcard/apply', data);
    return response.data.data;
  },

  /**
   * Validate wildcard SSL certificate against domains
   */
  async validateWildcard(data: ValidateWildcardSSLRequest): Promise<WildcardValidationResult> {
    const response = await api.post('/ssl/wildcard/validate', data);
    return response.data.data;
  },
};
