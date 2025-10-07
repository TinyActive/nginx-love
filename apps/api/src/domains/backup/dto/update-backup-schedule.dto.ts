/**
 * DTO for updating a backup schedule
 */
export interface UpdateBackupScheduleDto {
  name?: string;
  schedule?: string;
  enabled?: boolean;
}
