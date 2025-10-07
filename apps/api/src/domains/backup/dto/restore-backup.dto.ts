export interface RestoreBackupDto {
  backupData: any;
}

export interface ImportConfigDto {
  version?: string;
  timestamp?: string;
  domains?: any[];
  ssl?: any[];
  modsec?: any;
  acl?: any[];
  notificationChannels?: any[];
  alertRules?: any[];
  users?: any[];
  nginxConfigs?: any[];
}
