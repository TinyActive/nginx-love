import { CreateUpstreamData, LoadBalancerConfigData, RealIpConfigData } from '../domains.types';

/**
 * DTO for creating a new domain
 */
export interface CreateDomainDto {
  name: string;
  upstreams: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  modsecEnabled?: boolean;
  realIpConfig?: RealIpConfigData;
}