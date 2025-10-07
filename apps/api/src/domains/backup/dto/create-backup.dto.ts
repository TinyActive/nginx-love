export interface CreateBackupDto {
  scheduleId: string;
  type?: 'manual' | 'scheduled';
}
