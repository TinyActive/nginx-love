/**
 * DTO for manual wildcard SSL certificate upload
 */
export interface UploadWildcardSSLDto {
  domainId: string;
  certificate: string;
  privateKey: string;
  chain?: string;
  issuer?: string;
  additionalDomainIds?: string[]; // Other domains to apply this wildcard cert to
}
