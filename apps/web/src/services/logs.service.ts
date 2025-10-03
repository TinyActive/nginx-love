import api from "./api";
import type { LogEntry } from "../types";

export interface GetLogsParams {
  limit?: number;
  page?: number;
  level?: "info" | "warning" | "error";
  type?: "access" | "error" | "system";
  search?: string;
  domain?: string;
}

export interface PaginatedLogsResponse {
  data: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LogStatistics {
  total: number;
  byLevel: {
    info: number;
    warning: number;
    error: number;
  };
  byType: {
    access: number;
    error: number;
    system: number;
  };
}

export interface DomainInfo {
  name: string;
  status: string;
}

/**
 * Get logs with optional filtering and pagination
 */
export const getLogs = async (
  params?: GetLogsParams
): Promise<PaginatedLogsResponse> => {
  const response = await api.get("/logs", { params });
  return response.data;
};

/**
 * Get log statistics
 */
export const getLogStatistics = async (): Promise<LogStatistics> => {
  const response = await api.get("/logs/stats");
  return response.data.data;
};

/**
 * Get list of available domains
 */
export const getAvailableDomains = async (): Promise<DomainInfo[]> => {
  const response = await api.get("/logs/domains");
  return response.data.data;
};

/**
 * Download logs as JSON file
 */
export const downloadLogs = async (params?: GetLogsParams): Promise<void> => {
  const response = await api.get("/logs/download", {
    params,
    responseType: "blob",
  });

  // Create a download link
  const blob = new Blob([response.data], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `logs-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
