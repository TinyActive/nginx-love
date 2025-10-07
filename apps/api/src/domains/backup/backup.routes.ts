import { Router, type IRouter } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getBackupSchedules,
  getBackupSchedule,
  createBackupSchedule,
  updateBackupSchedule,
  deleteBackupSchedule,
  toggleBackupSchedule,
  runBackupNow,
  exportConfig,
  importConfig,
  getBackupFiles,
  downloadBackup,
  deleteBackupFile,
} from './backup.controller';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/backup/schedules
 * @desc    Get all backup schedules
 * @access  Private (all roles)
 */
router.get('/schedules', getBackupSchedules);

/**
 * @route   GET /api/backup/schedules/:id
 * @desc    Get single backup schedule
 * @access  Private (all roles)
 */
router.get('/schedules/:id', getBackupSchedule);

/**
 * @route   POST /api/backup/schedules
 * @desc    Create backup schedule
 * @access  Private (admin, moderator)
 */
router.post('/schedules', authorize('admin', 'moderator'), createBackupSchedule);

/**
 * @route   PUT /api/backup/schedules/:id
 * @desc    Update backup schedule
 * @access  Private (admin, moderator)
 */
router.put('/schedules/:id', authorize('admin', 'moderator'), updateBackupSchedule);

/**
 * @route   DELETE /api/backup/schedules/:id
 * @desc    Delete backup schedule
 * @access  Private (admin, moderator)
 */
router.delete('/schedules/:id', authorize('admin', 'moderator'), deleteBackupSchedule);

/**
 * @route   PATCH /api/backup/schedules/:id/toggle
 * @desc    Toggle backup schedule enabled status
 * @access  Private (admin, moderator)
 */
router.patch('/schedules/:id/toggle', authorize('admin', 'moderator'), toggleBackupSchedule);

/**
 * @route   POST /api/backup/schedules/:id/run
 * @desc    Run backup now (manual)
 * @access  Private (admin, moderator)
 */
router.post('/schedules/:id/run', authorize('admin', 'moderator'), runBackupNow);

/**
 * @route   GET /api/backup/export
 * @desc    Export configuration
 * @access  Private (admin, moderator)
 */
router.get('/export', authorize('admin', 'moderator'), exportConfig);

/**
 * @route   POST /api/backup/import
 * @desc    Import configuration
 * @access  Private (admin)
 */
router.post('/import', authorize('admin'), importConfig);

/**
 * @route   GET /api/backup/files
 * @desc    Get all backup files
 * @access  Private (all roles)
 */
router.get('/files', getBackupFiles);

/**
 * @route   GET /api/backup/files/:id/download
 * @desc    Download backup file
 * @access  Private (admin, moderator)
 */
router.get('/files/:id/download', authorize('admin', 'moderator'), downloadBackup);

/**
 * @route   DELETE /api/backup/files/:id
 * @desc    Delete backup file
 * @access  Private (admin)
 */
router.delete('/files/:id', authorize('admin'), deleteBackupFile);

export default router;
