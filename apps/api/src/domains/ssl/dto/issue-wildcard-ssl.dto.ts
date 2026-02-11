/**
 * DTO for wildcard SSL certificate issuance using ACME DNS-01 challenge
 */
export interface IssueWildcardSSLDto {
  domainId: string;
  baseDomain: string; // e.g., "example.com" -> will issue *.example.com
  email?: string;
  dnsProvider: string; // DNS provider for DNS-01 challenge (e.g., "dns_cf")
  dnsCredentials?: Record<string, string>; // DNS API credentials
  autoRenew?: boolean;
}
