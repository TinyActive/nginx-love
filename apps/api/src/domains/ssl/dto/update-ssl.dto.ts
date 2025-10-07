/**
 * DTO for updating SSL certificate
 */
export interface UpdateSSLDto {
  certificate?: string;
  privateKey?: string;
  chain?: string;
  autoRenew?: boolean;
}
