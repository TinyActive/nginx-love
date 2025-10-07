/**
 * DTO for automatic SSL certificate issuance using Let's Encrypt/ZeroSSL
 */
export interface IssueAutoSSLDto {
  domainId: string;
  email?: string;
  autoRenew?: boolean;
}
