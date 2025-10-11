import { CreateUpstreamData, LoadBalancerConfigData, RealIpConfigData } from '../domains.types';

/**
 * DTO for updating a domain
 */
export interface UpdateDomainDto {
  name?: string;
  status?: string;
  modsecEnabled?: boolean;
  upstreams?: CreateUpstreamData[];
  loadBalancer?: LoadBalancerConfigData;
  realIpConfig?: RealIpConfigData;
}