export {
  type Ja4FingerprintType,
  FINGERPRINT_PATTERNS,
  FINGERPRINT_TYPE_HINTS,
  type FingerprintValidationResult,
  validateFingerprintPattern,
  sanitizeNginxCommentText,
  hasInvalidNameCharacters,
} from './fingerprint-patterns';

export {
  JA4_LOG_FIELD_NAMES,
  type Ja4LogFieldName,
  type Ja4LogFields,
  isJa4AccessLogLine,
  extractJa4FieldsFromLogLine,
  hasJa4FingerprintData,
} from './ja4-log-fields';
