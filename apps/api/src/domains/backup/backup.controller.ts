import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import { backupService } from './backup.service';
import { CreateBackupScheduleDto, UpdateBackupScheduleDto } from './dto';

/**
 * Get all backup schedules
 */
export const getBackupSchedules = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const schedules = await backupService.getBackupSchedules();

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    logger.error('Get backup schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get single backup schedule
 */
export const getBackupSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const schedule = await backupService.getBackupSchedule(id);

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    logger.error('Get backup schedule error:', error);

    if (error.message === 'Backup schedule not found') {
      res.status(404).json({
        success: false,
        message: 'Backup schedule not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Create backup schedule
 */
export const createBackupSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const dto: CreateBackupScheduleDto = req.body;

    const newSchedule = await backupService.createBackupSchedule(
      dto,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      message: 'Backup schedule created successfully',
      data: newSchedule,
    });
  } catch (error) {
    logger.error('Create backup schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update backup schedule
 */
export const updateBackupSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const dto: UpdateBackupScheduleDto = req.body;

    const updatedSchedule = await backupService.updateBackupSchedule(
      id,
      dto,
      req.user?.userId
    );

    res.json({
      success: true,
      message: 'Backup schedule updated successfully',
      data: updatedSchedule,
    });
  } catch (error) {
    logger.error('Update backup schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete backup schedule
 */
export const deleteBackupSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await backupService.deleteBackupSchedule(id, req.user?.userId);

    res.json({
      success: true,
      message: 'Backup schedule deleted successfully',
    });
  } catch (error) {
    logger.error('Delete backup schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Toggle backup schedule enabled status
 */
export const toggleBackupSchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const updated = await backupService.toggleBackupSchedule(id, req.user?.userId);

    res.json({
      success: true,
      message: `Backup schedule ${updated.enabled ? 'enabled' : 'disabled'}`,
      data: updated,
    });
  } catch (error: any) {
    logger.error('Toggle backup schedule error:', error);

    if (error.message === 'Backup schedule not found') {
      res.status(404).json({
        success: false,
        message: 'Backup schedule not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Run backup now (manual backup)
 */
export const runBackupNow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await backupService.runBackupNow(id, req.user?.userId);

    res.json({
      success: true,
      message: 'Backup completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Run backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Backup failed',
    });
  }
};

/**
 * Export configuration (download as JSON)
 */
export const exportConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const backupData = await backupService.exportConfig(req.user?.userId);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `nginx-config-${timestamp}.json`;

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.json(backupData);
  } catch (error) {
    logger.error('Export config error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
    });
  }
};

/**
 * Import configuration (restore from backup)
 */
export const importConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const backupData = req.body;

    const { results, nginxReloaded } = await backupService.importConfig(
      backupData,
      req.user?.userId
    );

    res.json({
      success: true,
      message: nginxReloaded
        ? 'Configuration restored successfully and nginx reloaded'
        : 'Configuration restored successfully, but nginx reload failed. Please reload manually.',
      data: results,
      nginxReloaded,
    });
  } catch (error: any) {
    logger.error('Import config error:', error);

    if (error.message === 'Invalid backup data') {
      res.status(400).json({
        success: false,
        message: 'Invalid backup data',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Import failed',
    });
  }
};

/**
 * Get all backup files
 */
export const getBackupFiles = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { scheduleId } = req.query;

    const backups = await backupService.getBackupFiles(scheduleId as string);

    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    logger.error('Get backup files error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Download backup file
 */
export const downloadBackup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const backup = await backupService.getBackupFileById(id);

    // Check if file exists
    const fs = require('fs/promises');
    try {
      await fs.access(backup.filepath);
    } catch {
      res.status(404).json({
        success: false,
        message: 'Backup file not found on disk',
      });
      return;
    }

    // Send file
    res.download(backup.filepath, backup.filename);

    logger.info(`Backup downloaded: ${backup.filename}`, {
      userId: req.user?.userId,
    });
  } catch (error: any) {
    logger.error('Download backup error:', error);

    if (error.message === 'Backup file not found') {
      res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Download failed',
    });
  }
};

/**
 * Delete backup file
 */
export const deleteBackupFile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await backupService.deleteBackupFile(id, req.user?.userId);

    res.json({
      success: true,
      message: 'Backup file deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete backup file error:', error);

    if (error.message === 'Backup file not found') {
      res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
