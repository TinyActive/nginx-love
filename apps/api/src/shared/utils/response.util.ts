import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types/common.types';

/**
 * Response utility helpers
 */
export class ResponseUtil {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
    };
    res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode: number = 500, errors?: any[]): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };
    res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T,
    pagination: PaginationMeta,
    message?: string
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination,
      ...(message && { message }),
    };
    res.status(200).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): void {
    ResponseUtil.success(res, data, message, 201);
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }
}
