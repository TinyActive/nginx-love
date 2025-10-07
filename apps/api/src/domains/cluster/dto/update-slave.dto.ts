/**
 * DTO for updating a slave node
 */
export interface UpdateSlaveNodeDto {
  name?: string;
  host?: string;
  port?: number;
  syncInterval?: number;
  syncEnabled?: boolean;
}
