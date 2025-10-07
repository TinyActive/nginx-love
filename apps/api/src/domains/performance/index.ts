/**
 * Performance Domain
 *
 * Main export file for the Performance domain.
 * Following Domain-Driven Design (DDD) patterns.
 */

// Types
export * from './performance.types';

// DTOs
export * from './dto';

// Services
export * from './performance.service';
export * from './services/metrics.service';

// Repository
export * from './performance.repository';

// Controller
export * from './performance.controller';

// Routes
export { default as performanceRoutes } from './performance.routes';
