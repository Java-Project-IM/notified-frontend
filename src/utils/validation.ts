// ============================================================================
// INPUT VALIDATION & SANITIZATION UTILITIES
// ============================================================================
// This file provides backward-compatible validation utilities.
// For comprehensive validation, see validation-rules.ts and business-validation.ts

// Re-export comprehensive validators
export * from './validation-rules'
export * from './business-validation'

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Student number format regex (YY-NNNN)
 */
const STUDENT_NUMBER_REGEX = /^\d{2}-\d{4}$/

/**
 * Subject code format regex (alphanumeric with optional dashes)
 */
const SUBJECT_CODE_REGEX = /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/i

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

// ============================================================================
// STRING SANITIZATION
// ============================================================================

/**
 * Remove HTML tags and dangerous characters from string
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize string and limit length
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and truncated string
 */
export function sanitizeWithLength(input: string, maxLength: number): string {
  const sanitized = sanitizeString(input)
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized
}

/**
 * Escape special characters for safe display
 * @param input - String to escape
 * @returns Escaped string
 */
export function escapeHtml(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' }
  }

  const trimmed = email.trim()

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  return { isValid: true }
}

/**
 * Validate email and sanitize
 * @param email - Email to validate and sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  const result = validateEmail(email)
  if (!result.isValid) return ''
  return email.trim().toLowerCase()
}

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * Validate person name (first/last name)
 * @param name - Name to validate
 * @param fieldName - Field name for error messages
 * @returns Validation result
 */
export function validateName(name: string, fieldName = 'Name'): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` }
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` }
  }

  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid characters` }
  }

  return { isValid: true }
}

// ============================================================================
// STUDENT NUMBER VALIDATION
// ============================================================================

/**
 * Validate student number format (YY-NNNN)
 * @param studentNumber - Student number to validate
 * @returns Validation result
 */
export function validateStudentNumber(studentNumber: string): ValidationResult {
  if (!studentNumber || studentNumber.trim().length === 0) {
    return { isValid: false, error: 'Student number is required' }
  }

  const trimmed = studentNumber.trim()

  if (!STUDENT_NUMBER_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Student number must be in format YY-NNNN (e.g., 24-0001)' }
  }

  return { isValid: true }
}

// ============================================================================
// SUBJECT CODE VALIDATION
// ============================================================================

/**
 * Validate subject code format
 * @param code - Subject code to validate
 * @returns Validation result
 */
export function validateSubjectCode(code: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Subject code is required' }
  }

  const trimmed = code.trim()

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Subject code must be at least 2 characters' }
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Subject code must be less than 20 characters' }
  }

  if (!SUBJECT_CODE_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Subject code must be alphanumeric (can contain dashes)' }
  }

  return { isValid: true }
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with specific requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' }
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }

  return { isValid: true }
}

// ============================================================================
// SECTION/YEAR VALIDATION
// ============================================================================

/**
 * Validate section name
 * @param section - Section name to validate
 * @returns Validation result
 */
export function validateSection(section: string): ValidationResult {
  if (!section || section.trim().length === 0) {
    return { isValid: false, error: 'Section is required' }
  }

  const trimmed = section.trim()

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Section name must be less than 20 characters' }
  }

  // Allow letters, numbers, and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Section name can only contain letters, numbers, and hyphens' }
  }

  return { isValid: true }
}

/**
 * Validate year level (1-12 for grade levels, or 1-6 for college)
 * @param yearLevel - Year level to validate
 * @param maxLevel - Maximum allowed level (default 12)
 * @returns Validation result
 */
export function validateYearLevel(
  yearLevel: number | string,
  maxLevel: number = 12
): ValidationResult {
  const year = typeof yearLevel === 'string' ? parseInt(yearLevel, 10) : yearLevel

  if (isNaN(year)) {
    return { isValid: false, error: 'Year level must be a number' }
  }

  if (year < 1 || year > maxLevel) {
    return { isValid: false, error: `Year level must be between 1 and ${maxLevel}` }
  }

  return { isValid: true }
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

/**
 * Maximum file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSize - Maximum size in bytes (default 10MB)
 * @returns Validation result
 */
export function validateFileSize(file: File, maxSize = MAX_FILE_SIZE): ValidationResult {
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1)
    return { isValid: false, error: `File size must be less than ${maxMB}MB` }
  }

  return { isValid: true }
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' }
  }

  return { isValid: true }
}

/**
 * Validate file for upload
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum size in bytes
 * @returns Validation result
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize = MAX_FILE_SIZE
): ValidationResult {
  const sizeResult = validateFileSize(file, maxSize)
  if (!sizeResult.isValid) return sizeResult

  const typeResult = validateFileType(file, allowedTypes)
  if (!typeResult.isValid) return typeResult

  return { isValid: true }
}

// ============================================================================
// BULK VALIDATION
// ============================================================================

/**
 * Validate multiple values and collect all errors
 * @param validations - Array of validation functions
 * @returns Object with isValid flag and array of errors
 */
export function validateMany(validations: (() => ValidationResult)[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const validate of validations) {
    const result = validate()
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
