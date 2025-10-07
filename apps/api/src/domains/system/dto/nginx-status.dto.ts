import { ApiResponse } from '../../../shared/types/common.types';
import { NginxStatus } from '../system.types';

/**
 * Response DTO for nginx status
 */
export interface NginxStatusResponseDto extends ApiResponse<NginxStatus> {}
