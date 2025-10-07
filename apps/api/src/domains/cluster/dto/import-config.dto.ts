import { SyncConfigData } from '../cluster.types';

/**
 * DTO for importing configuration from master
 */
export interface ImportConfigDto {
  hash: string;
  config: SyncConfigData;
}
