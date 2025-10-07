/**
 * DTO for creating a backup schedule
 */
export interface CreateBackupScheduleDto {
  name: string;
  schedule: string;
  enabled?: boolean;
}
