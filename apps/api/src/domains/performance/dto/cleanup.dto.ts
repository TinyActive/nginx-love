/**
 * DTO for DELETE /api/performance/cleanup request
 */
export interface CleanupQueryDto {
  days?: string;
}

/**
 * DTO for DELETE /api/performance/cleanup response
 */
export interface CleanupResponseDto {
  success: boolean;
  message: string;
  data: CleanupDataDto;
}

/**
 * Cleanup data structure
 */
export interface CleanupDataDto {
  deletedCount: number;
}
