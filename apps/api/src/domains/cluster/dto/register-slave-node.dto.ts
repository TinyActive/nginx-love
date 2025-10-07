/**
 * DTO for registering a new slave node
 */
export interface RegisterSlaveNodeDto {
  name: string;
  host: string;
  port?: number;
  syncInterval?: number;
}
