/**
 * DTO for manual SSL certificate upload
 */
export interface UploadManualSSLDto {
  domainId: string;
  certificate: string;
  privateKey: string;
  chain?: string;
  issuer?: string;
}
