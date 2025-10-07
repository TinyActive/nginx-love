import { SyncConfigData } from '../cluster.types';

/**
 * DTO for sync configuration export
 */
export interface SyncConfigDto {
  hash: string;
  config: SyncConfigData;
}
