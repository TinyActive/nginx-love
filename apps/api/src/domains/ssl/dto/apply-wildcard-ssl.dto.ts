/**
 * DTO for applying a wildcard SSL certificate to additional domains
 */
export interface ApplyWildcardSSLDto {
  certificateId: string;
  targetDomainIds: string[];
}
