import { ApiResponse } from '../../../shared/types/common.types';
import { InstallationStatus } from '../system.types';

/**
 * Response DTO for installation status
 */
export interface InstallationStatusResponseDto extends ApiResponse<InstallationStatus> {}

/**
 * Response DTO for starting installation
 */
export interface StartInstallationResponseDto extends ApiResponse {
  message: string;
}
