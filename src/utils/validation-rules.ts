// ============================================================================
// COMPREHENSIVE FIELD-BY-FIELD VALIDATION RULES
// ============================================================================
// This module provides detailed validation for all fields across all modules
// with strict regex patterns, trim/escape rules, and examples

import { ValidationResult } from './validation'

// ============================================================================
// CONSTANTS & REGEX PATTERNS
// ============================================================================

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  // Student fields
  STUDENT_NUMBER_MIN: 7,
  STUDENT_NUMBER_MAX: 10,
  NAME_MIN: 2,
  NAME_MAX: 50,
  AGE_MIN: 3,
  AGE_MAX: 100,
  CONTACT_MIN: 10,
  CONTACT_MAX: 15,
  EMAIL_MAX: 254,
  SECTION_MAX: 20,
  GUARDIAN_NAME_MIN: 2,
  GUARDIAN_NAME_MAX: 100,

  // Subject fields
  SUBJECT_CODE_MIN: 2,
  SUBJECT_CODE_MAX: 20,
  SUBJECT_NAME_MIN: 3,
  SUBJECT_NAME_MAX: 100,
  YEAR_LEVEL_MIN: 1,
  YEAR_LEVEL_MAX: 12,
  SECTION_LEVEL_MIN: 7,
  SECTION_LEVEL_MAX: 12,
  COLLEGE_YEAR_MIN: 1,
  COLLEGE_YEAR_MAX: 6,
  CAPACITY_MIN: 1,
  CAPACITY_MAX: 500,

  // Auth fields
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  OTP_LENGTH: 6,
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,

  // File uploads
  MAX_FILE_SIZE_MB: 10,
  PROFILE_PHOTO_MAX_MB: 5,
  DOCUMENT_MAX_MB: 25,
  MAX_FILENAME_LENGTH: 255,

  // NFC/ID Card
  NFC_ID_MIN: 8,
  NFC_ID_MAX: 32,
  CARD_NUMBER_LENGTH: 16,

  // Search
  SEARCH_MIN: 1,
  SEARCH_MAX: 100,
  NOTES_MAX: 500,
  REMARKS_MAX: 1000,
} as const

/**
 * Comprehensive Regex Patterns
 */
export const VALIDATION_PATTERNS = {
  // Student Number: YY-NNNN format (e.g., 24-0001, 23-1234)
  STUDENT_NUMBER: /^\d{2}-\d{4}$/,
  STUDENT_NUMBER_FLEXIBLE: /^\d{2,4}-\d{3,6}$/,

  // Names: Letters, spaces, hyphens, apostrophes (supports accented chars)
  NAME: /^[a-zA-ZÀ-ÿ\u00C0-\u017F\s'-]+$/,
  NAME_STRICT: /^[A-Za-z][A-Za-zÀ-ÿ\u00C0-\u017F\s'-]*[A-Za-zÀ-ÿ\u00C0-\u017F]$/,

  // Email: RFC 5322 compliant with common TLDs
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  SCHOOL_EMAIL:
    /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*(?:edu|edu\.[a-z]{2}|ac\.[a-z]{2}|school\.[a-z]{2,3}|university\.[a-z]{2,3})$/i,

  // Phone: International format with country code
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{9,14}$/,
  PHONE_PH: /^(?:\+63|0)?9\d{9}$/,
  PHONE_US: /^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/,
  CONTACT: /^[\d\s()+-]{10,20}$/,

  // Subject Code: Alphanumeric with optional dashes
  SUBJECT_CODE: /^[A-Z]{2,4}\d{2,4}(?:-[A-Z0-9]+)?$/i,
  SUBJECT_CODE_FLEXIBLE: /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/i,

  // Section: Alphanumeric with dashes
  SECTION: /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/,

  // Password: At least 1 uppercase, 1 lowercase, 1 number
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PASSWORD_MEDIUM:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&#^()_+=[\]{}|\\:";'<>,.?/~`-]{8,}$/,

  // OTP: 6 digits
  OTP: /^\d{6}$/,

  // NFC/Card
  NFC_ID: /^[A-Fa-f0-9]{8,32}$/,
  CARD_NUMBER: /^\d{16}$/,

  // Date formats
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  DATE_TIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/,
  TIME_24H: /^(?:[01]\d|2[0-3]):[0-5]\d$/,

  // Filename
  FILENAME_SAFE: /^[a-zA-Z0-9_\-. ()[\]]+$/,

  // Search term (prevent injection)
  SEARCH_SAFE: /^[a-zA-Z0-9\s\-_.@]+$/,

  // Alphanumeric only
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  ALPHANUMERIC_SPACE: /^[A-Za-z0-9\s]+$/,

  // UUID
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // MongoDB ObjectId
  MONGO_ID: /^[a-f\d]{24}$/i,
} as const

/**
 * Allowed MIME Types
 */
export const ALLOWED_MIME_TYPES = {
  PROFILE_PHOTO: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  EXCEL: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  ALL_IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
} as const

/**
 * Student Status Types
 */
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred',
  SUSPENDED: 'suspended',
  DROPPED: 'dropped',
} as const

export type StudentStatus = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS]

/**
 * Attendance Status Types
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const

export type AttendanceStatusType = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]

/**
 * Comprehensive Validation Rules organized by module
 * Use these rules for reference and validation logic
 */
export const VALIDATION_RULES = {
  STUDENT: {
    STUDENT_NUMBER: {
      MIN_LENGTH: VALIDATION_CONSTANTS.STUDENT_NUMBER_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.STUDENT_NUMBER_MAX,
      PATTERN: VALIDATION_PATTERNS.STUDENT_NUMBER_FLEXIBLE,
      REQUIRED: true,
    },
    FIRST_NAME: {
      MIN_LENGTH: VALIDATION_CONSTANTS.NAME_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.NAME_MAX,
      PATTERN: VALIDATION_PATTERNS.NAME_STRICT,
      REQUIRED: true,
    },
    LAST_NAME: {
      MIN_LENGTH: VALIDATION_CONSTANTS.NAME_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.NAME_MAX,
      PATTERN: VALIDATION_PATTERNS.NAME_STRICT,
      REQUIRED: true,
    },
    MIDDLE_NAME: {
      MIN_LENGTH: VALIDATION_CONSTANTS.NAME_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.NAME_MAX,
      PATTERN: VALIDATION_PATTERNS.NAME_STRICT,
      REQUIRED: false,
    },
    EMAIL: {
      MAX_LENGTH: VALIDATION_CONSTANTS.EMAIL_MAX,
      PATTERN: VALIDATION_PATTERNS.EMAIL,
      REQUIRED: true,
    },
    AGE: {
      MIN: VALIDATION_CONSTANTS.AGE_MIN,
      MAX: VALIDATION_CONSTANTS.AGE_MAX,
      REQUIRED: false,
    },
    CONTACT: {
      MIN_LENGTH: VALIDATION_CONSTANTS.CONTACT_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.CONTACT_MAX,
      PATTERN: VALIDATION_PATTERNS.CONTACT,
      REQUIRED: false,
    },
    STATUS: {
      ALLOWED_VALUES: Object.values(STUDENT_STATUS) as string[],
      REQUIRED: false,
    },
  },
  SUBJECT: {
    CODE: {
      MIN_LENGTH: VALIDATION_CONSTANTS.SUBJECT_CODE_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.SUBJECT_CODE_MAX,
      PATTERN: VALIDATION_PATTERNS.SUBJECT_CODE_FLEXIBLE,
      REQUIRED: true,
    },
    NAME: {
      MIN_LENGTH: VALIDATION_CONSTANTS.SUBJECT_NAME_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.SUBJECT_NAME_MAX,
      REQUIRED: true,
    },
    SECTION: {
      MAX_LENGTH: VALIDATION_CONSTANTS.SECTION_MAX,
      PATTERN: VALIDATION_PATTERNS.SECTION,
      REQUIRED: false,
    },
    YEAR_LEVEL: {
      MIN: VALIDATION_CONSTANTS.YEAR_LEVEL_MIN,
      MAX: VALIDATION_CONSTANTS.YEAR_LEVEL_MAX,
      REQUIRED: false,
    },
    CAPACITY: {
      MIN: VALIDATION_CONSTANTS.CAPACITY_MIN,
      MAX: VALIDATION_CONSTANTS.CAPACITY_MAX,
      REQUIRED: false,
    },
  },
  ATTENDANCE: {
    STATUS: {
      ALLOWED_VALUES: Object.values(ATTENDANCE_STATUS) as (
        | 'present'
        | 'absent'
        | 'late'
        | 'excused'
      )[],
      REQUIRED: true,
    },
    DATE: {
      PATTERN: VALIDATION_PATTERNS.DATE_ISO,
      REQUIRED: true,
      NOT_IN_FUTURE: true,
    },
    NOTES: {
      MAX_LENGTH: VALIDATION_CONSTANTS.NOTES_MAX,
      REQUIRED: false,
      ALLOWED_PATTERN: /^[\w\s.,!?()-]*$/,
      BLOCKED_PATTERN: /<script|javascript:|on\w+=/i,
    },
    REMARKS: {
      MAX_LENGTH: VALIDATION_CONSTANTS.REMARKS_MAX,
      REQUIRED: false,
    },
  },
  AUTH: {
    PASSWORD: {
      MIN_LENGTH: VALIDATION_CONSTANTS.PASSWORD_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.PASSWORD_MAX,
      PATTERN: VALIDATION_PATTERNS.PASSWORD_MEDIUM,
      REQUIRED: true,
    },
    EMAIL: {
      MAX_LENGTH: VALIDATION_CONSTANTS.EMAIL_MAX,
      PATTERN: VALIDATION_PATTERNS.EMAIL,
      REQUIRED: true,
    },
    OTP: {
      LENGTH: VALIDATION_CONSTANTS.OTP_LENGTH,
      PATTERN: VALIDATION_PATTERNS.OTP,
      REQUIRED: true,
    },
  },
  NFC: {
    NFC_ID: {
      MIN_LENGTH: VALIDATION_CONSTANTS.NFC_ID_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.NFC_ID_MAX,
      PATTERN: VALIDATION_PATTERNS.NFC_ID,
      REQUIRED: false,
    },
    CARD_NUMBER: {
      LENGTH: VALIDATION_CONSTANTS.CARD_NUMBER_LENGTH,
      PATTERN: VALIDATION_PATTERNS.CARD_NUMBER,
      REQUIRED: false,
    },
  },
  FILE: {
    PROFILE_PHOTO: {
      MAX_SIZE_MB: VALIDATION_CONSTANTS.PROFILE_PHOTO_MAX_MB,
      ALLOWED_TYPES: ALLOWED_MIME_TYPES.PROFILE_PHOTO,
      MAX_FILENAME_LENGTH: VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH,
    },
    DOCUMENT: {
      MAX_SIZE_MB: VALIDATION_CONSTANTS.DOCUMENT_MAX_MB,
      ALLOWED_TYPES: ALLOWED_MIME_TYPES.DOCUMENTS,
      MAX_FILENAME_LENGTH: VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH,
    },
    EXCEL: {
      MAX_SIZE_MB: VALIDATION_CONSTANTS.MAX_FILE_SIZE_MB,
      ALLOWED_TYPES: ALLOWED_MIME_TYPES.EXCEL,
      MAX_FILENAME_LENGTH: VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH,
    },
  },
  SEARCH: {
    TERM: {
      MIN_LENGTH: VALIDATION_CONSTANTS.SEARCH_MIN,
      MAX_LENGTH: VALIDATION_CONSTANTS.SEARCH_MAX,
      PATTERN: VALIDATION_PATTERNS.SEARCH_SAFE,
    },
  },
} as const

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Trim whitespace from string
 */
export function trimString(value: string): string {
  return value?.trim() ?? ''
}

/**
 * Normalize whitespace (collapse multiple spaces to single)
 */
export function normalizeWhitespace(value: string): string {
  return trimString(value).replace(/\s+/g, ' ')
}

/**
 * Remove HTML tags and scripts (XSS prevention)
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Sanitize string (trim, escape, normalize)
 */
export function sanitizeInput(value: string, maxLength?: number): string {
  let result = normalizeWhitespace(escapeHtml(value))
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength)
  }
  return result
}

/**
 * Sanitize for search (remove SQL-like patterns)
 */
export function sanitizeSearch(value: string): string {
  return sanitizeInput(value)
    .replace(/['";\\%_]/g, '')
    .substring(0, VALIDATION_CONSTANTS.SEARCH_MAX)
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(value: string): string {
  return trimString(value).toLowerCase()
}

/**
 * Sanitize phone (remove non-digits except +)
 */
export function sanitizePhone(value: string): string {
  return trimString(value).replace(/[^\d+]/g, '')
}

// ============================================================================
// STUDENT VALIDATION
// ============================================================================

/**
 * Student Number Validation
 * Format: YY-NNNN (e.g., 24-0001)
 * Valid: "24-0001", "23-1234", "25-9999"
 * Invalid: "1-001", "2024-001", "24001", "24-ABCD"
 */
export function validateStudentNumber(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Student number is required' }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.STUDENT_NUMBER_MIN) {
    return {
      isValid: false,
      error: `Student number must be at least ${VALIDATION_CONSTANTS.STUDENT_NUMBER_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.STUDENT_NUMBER_MAX) {
    return {
      isValid: false,
      error: `Student number must be at most ${VALIDATION_CONSTANTS.STUDENT_NUMBER_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.STUDENT_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'Student number must be in format YY-NNNN (e.g., 24-0001)' }
  }

  // Validate year part (should be reasonable - not too far in past or future)
  const yearPart = parseInt(trimmed.substring(0, 2), 10)
  const currentYear = new Date().getFullYear() % 100
  if (yearPart > currentYear + 1 || yearPart < currentYear - 10) {
    return { isValid: false, error: 'Student number year appears to be invalid' }
  }

  return { isValid: true }
}

/**
 * First/Last Name Validation
 * Valid: "John", "Mary-Jane", "O'Brien", "José", "Jean-Pierre"
 * Invalid: "J", "John123", "John@Doe", ""
 */
export function validatePersonName(value: string, fieldName = 'Name'): ValidationResult {
  const trimmed = normalizeWhitespace(value)

  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.NAME_MIN) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${VALIDATION_CONSTANTS.NAME_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.NAME_MAX) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${VALIDATION_CONSTANTS.NAME_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.NAME.test(trimmed)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    }
  }

  // Ensure doesn't start/end with special chars
  if (/^[-'\s]|[-'\s]$/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} cannot start or end with special characters` }
  }

  return { isValid: true }
}

/**
 * Age Validation (3-100 years)
 * Valid: 5, 18, 65
 * Invalid: 2, 101, -5, "abc"
 */
export function validateAge(value: number | string): ValidationResult {
  const age = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(age)) {
    return { isValid: false, error: 'Age must be a valid number' }
  }

  if (!Number.isInteger(age)) {
    return { isValid: false, error: 'Age must be a whole number' }
  }

  if (age < VALIDATION_CONSTANTS.AGE_MIN) {
    return { isValid: false, error: `Age must be at least ${VALIDATION_CONSTANTS.AGE_MIN} years` }
  }

  if (age > VALIDATION_CONSTANTS.AGE_MAX) {
    return { isValid: false, error: `Age must be at most ${VALIDATION_CONSTANTS.AGE_MAX} years` }
  }

  return { isValid: true }
}

/**
 * Birthdate Validation
 * - Must be valid date
 * - Must not be in the future
 * - Must result in age between 3-100
 * Valid: "2000-05-15", "1990-12-25"
 * Invalid: "2025-01-01" (future), "1920-01-01" (too old)
 */
export function validateBirthdate(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Birthdate is required' }
  }

  if (!VALIDATION_PATTERNS.DATE_ISO.test(trimmed)) {
    return { isValid: false, error: 'Birthdate must be in YYYY-MM-DD format' }
  }

  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date > today) {
    return { isValid: false, error: 'Birthdate cannot be in the future' }
  }

  // Calculate age
  const age = calculateAge(date)
  if (age < VALIDATION_CONSTANTS.AGE_MIN) {
    return {
      isValid: false,
      error: `Person must be at least ${VALIDATION_CONSTANTS.AGE_MIN} years old`,
    }
  }

  if (age > VALIDATION_CONSTANTS.AGE_MAX) {
    return {
      isValid: false,
      error: `Person cannot be more than ${VALIDATION_CONSTANTS.AGE_MAX} years old`,
    }
  }

  return { isValid: true }
}

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--
  }

  return age
}

/**
 * Contact Number Validation
 * Valid: "+639123456789", "09123456789", "+1-234-567-8901"
 * Invalid: "123", "abc123", "++123"
 */
export function validateContact(value: string): ValidationResult {
  const sanitized = sanitizePhone(value)

  if (!sanitized) {
    return { isValid: false, error: 'Contact number is required' }
  }

  if (sanitized.length < VALIDATION_CONSTANTS.CONTACT_MIN) {
    return {
      isValid: false,
      error: `Contact number must be at least ${VALIDATION_CONSTANTS.CONTACT_MIN} digits`,
    }
  }

  if (sanitized.length > VALIDATION_CONSTANTS.CONTACT_MAX) {
    return {
      isValid: false,
      error: `Contact number must be at most ${VALIDATION_CONSTANTS.CONTACT_MAX} digits`,
    }
  }

  if (!VALIDATION_PATTERNS.PHONE_INTERNATIONAL.test(sanitized)) {
    return { isValid: false, error: 'Invalid contact number format' }
  }

  return { isValid: true }
}

/**
 * Email Validation (RFC 5322)
 * Valid: "test@example.com", "user.name+tag@domain.co.uk"
 * Invalid: "test", "@example.com", "test@", "test@.com"
 */
export function validateEmail(value: string): ValidationResult {
  const trimmed = sanitizeEmail(value)

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.EMAIL_MAX) {
    return {
      isValid: false,
      error: `Email must be at most ${VALIDATION_CONSTANTS.EMAIL_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.EMAIL.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  // Additional checks
  const [localPart, domain] = trimmed.split('@')
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part too long' }
  }
  if (domain && domain.length > 253) {
    return { isValid: false, error: 'Email domain too long' }
  }

  return { isValid: true }
}

/**
 * School Email Validation (optional domain restriction)
 * Valid: "student@school.edu", "user@university.ac.uk"
 * Invalid: "user@gmail.com" (if school domain required)
 */
export function validateSchoolEmail(value: string, schoolDomain?: string): ValidationResult {
  const emailResult = validateEmail(value)
  if (!emailResult.isValid) return emailResult

  if (schoolDomain) {
    const domain = value.split('@')[1]?.toLowerCase()
    if (!domain?.endsWith(schoolDomain.toLowerCase())) {
      return { isValid: false, error: `Email must be from ${schoolDomain} domain` }
    }
  }

  return { isValid: true }
}

/**
 * Student Status Validation
 * Valid: "active", "inactive", "graduated", "transferred", "suspended", "dropped"
 * Invalid: "unknown", "", "Active" (case sensitive)
 */
export function validateStudentStatus(value: string): ValidationResult {
  const trimmed = trimString(value).toLowerCase()

  if (!trimmed) {
    return { isValid: false, error: 'Student status is required' }
  }

  const validStatuses = Object.values(STUDENT_STATUS)
  if (!validStatuses.includes(trimmed as StudentStatus)) {
    return { isValid: false, error: `Status must be one of: ${validStatuses.join(', ')}` }
  }

  return { isValid: true }
}

// ============================================================================
// SUBJECT/COURSE VALIDATION
// ============================================================================

/**
 * Subject Code Validation
 * Valid: "CS101", "MATH201", "ENG-101", "IT302-A"
 * Invalid: "1", "!!!", "a very long subject code here"
 */
export function validateSubjectCode(value: string): ValidationResult {
  const trimmed = trimString(value).toUpperCase()

  if (!trimmed) {
    return { isValid: false, error: 'Subject code is required' }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.SUBJECT_CODE_MIN) {
    return {
      isValid: false,
      error: `Subject code must be at least ${VALIDATION_CONSTANTS.SUBJECT_CODE_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.SUBJECT_CODE_MAX) {
    return {
      isValid: false,
      error: `Subject code must be at most ${VALIDATION_CONSTANTS.SUBJECT_CODE_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.SUBJECT_CODE_FLEXIBLE.test(trimmed)) {
    return { isValid: false, error: 'Subject code can only contain letters, numbers, and hyphens' }
  }

  return { isValid: true }
}

/**
 * Subject Name Validation
 * Valid: "Introduction to Computer Science", "Math 101"
 * Invalid: "", "AB", very long names > 100 chars
 */
export function validateSubjectName(value: string): ValidationResult {
  const trimmed = normalizeWhitespace(value)

  if (!trimmed) {
    return { isValid: false, error: 'Subject name is required' }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.SUBJECT_NAME_MIN) {
    return {
      isValid: false,
      error: `Subject name must be at least ${VALIDATION_CONSTANTS.SUBJECT_NAME_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.SUBJECT_NAME_MAX) {
    return {
      isValid: false,
      error: `Subject name must be at most ${VALIDATION_CONSTANTS.SUBJECT_NAME_MAX} characters`,
    }
  }

  return { isValid: true }
}

/**
 * Section Validation
 * Valid: "A", "B-1", "SEC-A", "1A"
 * Invalid: "", "!!!!", very long sections
 */
export function validateSection(value: string): ValidationResult {
  const trimmed = trimString(value).toUpperCase()

  if (!trimmed) {
    return { isValid: false, error: 'Section is required' }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.SECTION_MAX) {
    return {
      isValid: false,
      error: `Section must be at most ${VALIDATION_CONSTANTS.SECTION_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.SECTION.test(trimmed)) {
    return { isValid: false, error: 'Section can only contain letters, numbers, and hyphens' }
  }

  return { isValid: true }
}

/**
 * Year Level Validation (for college: 1-6, for high school: 7-12)
 * Valid: 1, 4, 10 (depending on type)
 * Invalid: 0, 15, -1, "first"
 */
export function validateYearLevel(
  value: number | string,
  type: 'college' | 'highschool' = 'college'
): ValidationResult {
  const level = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(level)) {
    return { isValid: false, error: 'Year level must be a valid number' }
  }

  if (!Number.isInteger(level)) {
    return { isValid: false, error: 'Year level must be a whole number' }
  }

  if (type === 'college') {
    if (
      level < VALIDATION_CONSTANTS.COLLEGE_YEAR_MIN ||
      level > VALIDATION_CONSTANTS.COLLEGE_YEAR_MAX
    ) {
      return {
        isValid: false,
        error: `College year level must be between ${VALIDATION_CONSTANTS.COLLEGE_YEAR_MIN} and ${VALIDATION_CONSTANTS.COLLEGE_YEAR_MAX}`,
      }
    }
  } else {
    if (
      level < VALIDATION_CONSTANTS.SECTION_LEVEL_MIN ||
      level > VALIDATION_CONSTANTS.SECTION_LEVEL_MAX
    ) {
      return {
        isValid: false,
        error: `Grade level must be between ${VALIDATION_CONSTANTS.SECTION_LEVEL_MIN} and ${VALIDATION_CONSTANTS.SECTION_LEVEL_MAX}`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Description Validation
 * Valid: "Introduction to programming", "This course covers..."
 * Invalid: very long descriptions, XSS attempts
 */
export function validateDescription(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: true } // Description is often optional
  }

  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Description must be 1000 characters or less' }
  }

  // Check for script injection
  if (/<script|javascript:|on\w+\s*=/i.test(trimmed)) {
    return { isValid: false, error: 'Description contains invalid content' }
  }

  return { isValid: true }
}

/**
 * Instructor Name Validation
 * Valid: "John Smith", "Dr. Jane Doe", "Maria Santos"
 * Invalid: empty, numbers only, special characters
 */
export function validateInstructorName(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: true } // Instructor is often optional
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Instructor name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Instructor name must be 100 characters or less' }
  }

  // Allow letters, spaces, hyphens, apostrophes, periods (for titles like Dr.)
  const namePattern = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-'.]*[A-Za-zÀ-ÿ.]$/
  if (!namePattern.test(trimmed)) {
    return { isValid: false, error: 'Instructor name contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Room Number Validation
 * Valid: "101", "A-201", "Lab 3", "Room 301B"
 * Invalid: very long strings, special characters
 */
export function validateRoomNumber(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: true } // Room is often optional
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Room number must be 50 characters or less' }
  }

  // Allow alphanumeric, spaces, hyphens
  const roomPattern = /^[A-Za-z0-9\s-]+$/
  if (!roomPattern.test(trimmed)) {
    return { isValid: false, error: 'Room number contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Course Capacity Validation
 * Valid: 30, 50, 100
 * Invalid: 0, -5, 1000
 */
export function validateCapacity(value: number | string): ValidationResult {
  const capacity = typeof value === 'string' ? parseInt(value, 10) : value

  if (isNaN(capacity)) {
    return { isValid: false, error: 'Capacity must be a valid number' }
  }

  if (!Number.isInteger(capacity)) {
    return { isValid: false, error: 'Capacity must be a whole number' }
  }

  if (capacity < VALIDATION_CONSTANTS.CAPACITY_MIN) {
    return {
      isValid: false,
      error: `Capacity must be at least ${VALIDATION_CONSTANTS.CAPACITY_MIN}`,
    }
  }

  if (capacity > VALIDATION_CONSTANTS.CAPACITY_MAX) {
    return {
      isValid: false,
      error: `Capacity must be at most ${VALIDATION_CONSTANTS.CAPACITY_MAX}`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// ATTENDANCE VALIDATION
// ============================================================================

/**
 * Attendance Status Validation
 * Valid: "present", "absent", "late", "excused"
 * Invalid: "here", "missing", ""
 */
export function validateAttendanceStatus(value: string): ValidationResult {
  const trimmed = trimString(value).toLowerCase()

  if (!trimmed) {
    return { isValid: false, error: 'Attendance status is required' }
  }

  const validStatuses = Object.values(ATTENDANCE_STATUS)
  if (!validStatuses.includes(trimmed as AttendanceStatusType)) {
    return { isValid: false, error: `Status must be one of: ${validStatuses.join(', ')}` }
  }

  return { isValid: true }
}

/**
 * Attendance Timestamp Validation (must not be in the future)
 * Valid: "2024-01-15T09:30:00Z", past dates
 * Invalid: future dates, invalid format
 */
export function validateAttendanceTimestamp(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Timestamp is required' }
  }

  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid timestamp format' }
  }

  const now = new Date()
  // Allow 5 minutes tolerance for clock drift
  const tolerance = 5 * 60 * 1000
  if (date.getTime() > now.getTime() + tolerance) {
    return { isValid: false, error: 'Attendance timestamp cannot be in the future' }
  }

  return { isValid: true }
}

/**
 * Attendance Date Validation
 * Valid: "2024-01-15"
 * Invalid: future dates, invalid format
 */
export function validateAttendanceDate(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Date is required' }
  }

  if (!VALIDATION_PATTERNS.DATE_ISO.test(trimmed)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' }
  }

  const date = new Date(trimmed)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' }
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (date > today) {
    return { isValid: false, error: 'Attendance date cannot be in the future' }
  }

  return { isValid: true }
}

/**
 * Notes/Remarks Validation
 * Valid: "Student arrived late due to traffic"
 * Invalid: very long texts > 500/1000 chars
 */
export function validateNotes(
  value: string,
  maxLength = VALIDATION_CONSTANTS.NOTES_MAX
): ValidationResult {
  const sanitized = sanitizeInput(value)

  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Notes must be at most ${maxLength} characters` }
  }

  return { isValid: true }
}

// ============================================================================
// NFC / ID CARD VALIDATION
// ============================================================================

/**
 * NFC ID Validation (hex string)
 * Valid: "A1B2C3D4E5F6", "01234567890ABCDEF"
 * Invalid: "xyz", "123", very short strings
 */
export function validateNfcId(value: string): ValidationResult {
  const trimmed = trimString(value).toUpperCase()

  if (!trimmed) {
    return { isValid: false, error: 'NFC ID is required' }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.NFC_ID_MIN) {
    return {
      isValid: false,
      error: `NFC ID must be at least ${VALIDATION_CONSTANTS.NFC_ID_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.NFC_ID_MAX) {
    return {
      isValid: false,
      error: `NFC ID must be at most ${VALIDATION_CONSTANTS.NFC_ID_MAX} characters`,
    }
  }

  if (!VALIDATION_PATTERNS.NFC_ID.test(trimmed)) {
    return { isValid: false, error: 'NFC ID must be a valid hexadecimal string' }
  }

  return { isValid: true }
}

/**
 * Card Number Validation (16 digits)
 * Valid: "1234567890123456"
 * Invalid: "123", "12345678901234567", "ABCDEFGHIJKLMNOP"
 */
export function validateCardNumber(value: string): ValidationResult {
  const trimmed = trimString(value).replace(/\s+/g, '')

  if (!trimmed) {
    return { isValid: false, error: 'Card number is required' }
  }

  if (!VALIDATION_PATTERNS.CARD_NUMBER.test(trimmed)) {
    return { isValid: false, error: 'Card number must be exactly 16 digits' }
  }

  return { isValid: true }
}

// ============================================================================
// AUTHENTICATION VALIDATION
// ============================================================================

/**
 * Password Validation
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 * Valid: "Password123", "MyStr0ngP@ss"
 * Invalid: "pass", "password", "12345678", "PASSWORD"
 */
export function validatePassword(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'Password is required' }
  }

  if (value.length < VALIDATION_CONSTANTS.PASSWORD_MIN) {
    return {
      isValid: false,
      error: `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD_MIN} characters`,
    }
  }

  if (value.length > VALIDATION_CONSTANTS.PASSWORD_MAX) {
    return {
      isValid: false,
      error: `Password must be at most ${VALIDATION_CONSTANTS.PASSWORD_MAX} characters`,
    }
  }

  if (!/[a-z]/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }

  if (!/[A-Z]/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (!/\d/.test(value)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }

  // Check for common weak passwords
  const commonPasswords = ['password', 'password1', '12345678', 'qwerty123']
  if (commonPasswords.includes(value.toLowerCase())) {
    return { isValid: false, error: 'Password is too common. Please choose a stronger password' }
  }

  return { isValid: true }
}

/**
 * Password Confirmation Validation
 * Valid: passwords match
 * Invalid: passwords don't match
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string
): ValidationResult {
  if (!confirmation) {
    return { isValid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmation) {
    return { isValid: false, error: 'Passwords do not match' }
  }

  return { isValid: true }
}

/**
 * Password Strength Validation (more comprehensive check)
 * Returns strength level and feedback
 */
export function validatePasswordStrength(
  value: string
): ValidationResult & { strength?: 'weak' | 'fair' | 'strong' } {
  if (!value) {
    return { isValid: false, error: 'Password is required' }
  }

  let score = 0
  const feedback: string[] = []

  // Length checks
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (value.length >= 16) score++

  // Character variety checks
  if (/[a-z]/.test(value)) score++
  if (/[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[!@#$%^&*(),.?":{}|<>_\-+=[]\\\\\/`~;']/.test(value)) score++

  // Penalty for common patterns
  if (/(.)\1{2,}/.test(value)) {
    score -= 2
    feedback.push('Avoid repeated characters')
  }
  if (/^[a-zA-Z]+$/.test(value)) {
    score -= 1
    feedback.push('Add numbers or special characters')
  }
  if (/^[0-9]+$/.test(value)) {
    score -= 2
    feedback.push('Add letters and special characters')
  }

  // Common password check
  const commonPasswords = [
    'password',
    'password1',
    '12345678',
    'qwerty123',
    'letmein',
    'welcome',
    'admin',
  ]
  if (commonPasswords.some((p) => value.toLowerCase().includes(p))) {
    return {
      isValid: false,
      error: 'Password contains a common word. Please choose a stronger password',
      strength: 'weak',
    }
  }

  // Minimum requirements
  if (value.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' }
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and numbers',
      strength: 'weak',
    }
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'strong'
  if (score >= 6) {
    strength = 'strong'
  } else if (score >= 4) {
    strength = 'fair'
  } else {
    strength = 'weak'
  }

  return {
    isValid: true,
    strength,
    error: feedback.length > 0 ? feedback.join('. ') : undefined,
  }
}

/**
 * OTP Validation (6 digits)
 * Valid: "123456", "000000"
 * Invalid: "12345", "1234567", "abcdef"
 */
export function validateOtp(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'OTP code is required' }
  }

  if (!VALIDATION_PATTERNS.OTP.test(trimmed)) {
    return { isValid: false, error: 'OTP must be exactly 6 digits' }
  }

  return { isValid: true }
}

/**
 * Username Validation
 * Valid: "john_doe", "user123", "admin"
 * Invalid: "a", "user with spaces", "@special!"
 */
export function validateUsername(value: string): ValidationResult {
  const trimmed = trimString(value).toLowerCase()

  if (!trimmed) {
    return { isValid: false, error: 'Username is required' }
  }

  if (trimmed.length < VALIDATION_CONSTANTS.USERNAME_MIN) {
    return {
      isValid: false,
      error: `Username must be at least ${VALIDATION_CONSTANTS.USERNAME_MIN} characters`,
    }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.USERNAME_MAX) {
    return {
      isValid: false,
      error: `Username must be at most ${VALIDATION_CONSTANTS.USERNAME_MAX} characters`,
    }
  }

  if (!/^[a-z][a-z0-9_]*$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username must start with a letter and contain only letters, numbers, and underscores',
    }
  }

  return { isValid: true }
}

// ============================================================================
// FILE UPLOAD VALIDATION
// ============================================================================

/**
 * File Size Validation
 * Valid: file under limit
 * Invalid: file over limit
 */
export function validateFileSize(file: File, maxSizeMB: number): ValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size must be under ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    }
  }

  return { isValid: true }
}

/**
 * File Type Validation
 * Valid: file type in allowed list
 * Invalid: file type not in allowed list
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[] | string[]
): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { isValid: true }
}

/**
 * Filename Validation
 * Valid: "document.pdf", "profile_photo.jpg"
 * Invalid: "../../../etc/passwd", "file with <script>.pdf"
 */
export function validateFilename(filename: string): ValidationResult {
  const trimmed = trimString(filename)

  if (!trimmed) {
    return { isValid: false, error: 'Filename is required' }
  }

  if (trimmed.length > VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH) {
    return {
      isValid: false,
      error: `Filename must be at most ${VALIDATION_CONSTANTS.MAX_FILENAME_LENGTH} characters`,
    }
  }

  // Check for path traversal
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return { isValid: false, error: 'Filename contains invalid path characters' }
  }

  if (!VALIDATION_PATTERNS.FILENAME_SAFE.test(trimmed)) {
    return { isValid: false, error: 'Filename contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Profile Photo Validation (combined)
 */
export function validateProfilePhoto(file: File): ValidationResult {
  const sizeResult = validateFileSize(file, VALIDATION_CONSTANTS.PROFILE_PHOTO_MAX_MB)
  if (!sizeResult.isValid) return sizeResult

  const typeResult = validateFileType(file, ALLOWED_MIME_TYPES.PROFILE_PHOTO)
  if (!typeResult.isValid) return typeResult

  const nameResult = validateFilename(file.name)
  if (!nameResult.isValid) return nameResult

  return { isValid: true }
}

/**
 * Document Validation (combined)
 */
export function validateDocument(file: File): ValidationResult {
  const sizeResult = validateFileSize(file, VALIDATION_CONSTANTS.DOCUMENT_MAX_MB)
  if (!sizeResult.isValid) return sizeResult

  const typeResult = validateFileType(file, ALLOWED_MIME_TYPES.DOCUMENTS)
  if (!typeResult.isValid) return typeResult

  const nameResult = validateFilename(file.name)
  if (!nameResult.isValid) return nameResult

  return { isValid: true }
}

/**
 * Excel File Validation
 */
export function validateExcelFile(file: File): ValidationResult {
  const sizeResult = validateFileSize(file, VALIDATION_CONSTANTS.MAX_FILE_SIZE_MB)
  if (!sizeResult.isValid) return sizeResult

  const typeResult = validateFileType(file, ALLOWED_MIME_TYPES.EXCEL)
  if (!typeResult.isValid) return typeResult

  return { isValid: true }
}

// ============================================================================
// SEARCH & FILTER VALIDATION
// ============================================================================

/**
 * Search Term Validation
 * Valid: "John Doe", "CS101", "search-term"
 * Invalid: ""; DROP TABLE", "<script>", very long searches
 */
export function validateSearchTerm(value: string): ValidationResult {
  const sanitized = sanitizeSearch(value)

  if (!sanitized) {
    return { isValid: true } // Empty search is often valid (returns all results)
  }

  if (sanitized.length < VALIDATION_CONSTANTS.SEARCH_MIN) {
    return {
      isValid: false,
      error: `Search term must be at least ${VALIDATION_CONSTANTS.SEARCH_MIN} character`,
    }
  }

  if (sanitized.length > VALIDATION_CONSTANTS.SEARCH_MAX) {
    return {
      isValid: false,
      error: `Search term must be at most ${VALIDATION_CONSTANTS.SEARCH_MAX} characters`,
    }
  }

  return { isValid: true }
}

/**
 * Date Range Filter Validation
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const startResult = validateAttendanceDate(startDate)
  if (!startResult.isValid) {
    return { isValid: false, error: `Start date: ${startResult.error}` }
  }

  const endResult = validateAttendanceDate(endDate)
  if (!endResult.isValid) {
    return { isValid: false, error: `End date: ${endResult.error}` }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return { isValid: false, error: 'Start date must be before or equal to end date' }
  }

  // Optional: limit date range (e.g., max 1 year)
  const maxRange = 365 * 24 * 60 * 60 * 1000 // 1 year in ms
  if (end.getTime() - start.getTime() > maxRange) {
    return { isValid: false, error: 'Date range cannot exceed 1 year' }
  }

  return { isValid: true }
}

/**
 * ID Validation (MongoDB ObjectId or numeric)
 */
export function validateId(value: string | number): ValidationResult {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 1) {
      return { isValid: false, error: 'ID must be a positive integer' }
    }
    return { isValid: true }
  }

  const trimmed = trimString(value)
  if (!trimmed) {
    return { isValid: false, error: 'ID is required' }
  }

  // Check if numeric string
  if (/^\d+$/.test(trimmed)) {
    return { isValid: true }
  }

  // Check if MongoDB ObjectId
  if (VALIDATION_PATTERNS.MONGO_ID.test(trimmed)) {
    return { isValid: true }
  }

  // Check if UUID
  if (VALIDATION_PATTERNS.UUID.test(trimmed)) {
    return { isValid: true }
  }

  return { isValid: false, error: 'Invalid ID format' }
}

// ============================================================================
// SCHEDULE VALIDATION
// ============================================================================

/**
 * Time Format Validation (HH:mm)
 * Valid: "09:00", "14:30", "23:59"
 * Invalid: "9:00", "25:00", "14:60"
 */
export function validateTimeFormat(value: string): ValidationResult {
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Time is required' }
  }

  if (!VALIDATION_PATTERNS.TIME_24H.test(trimmed)) {
    return { isValid: false, error: 'Time must be in HH:mm format (e.g., 09:00, 14:30)' }
  }

  return { isValid: true }
}

/**
 * Schedule Time Range Validation
 */
export function validateScheduleTimeRange(startTime: string, endTime: string): ValidationResult {
  const startResult = validateTimeFormat(startTime)
  if (!startResult.isValid) return startResult

  const endResult = validateTimeFormat(endTime)
  if (!endResult.isValid) return endResult

  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  if (startMinutes >= endMinutes) {
    return { isValid: false, error: 'End time must be after start time' }
  }

  // Optional: minimum class duration (e.g., 30 minutes)
  if (endMinutes - startMinutes < 30) {
    return { isValid: false, error: 'Schedule duration must be at least 30 minutes' }
  }

  return { isValid: true }
}

/**
 * Day of Week Validation
 */
export function validateDayOfWeek(value: string): ValidationResult {
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const trimmed = trimString(value)

  if (!trimmed) {
    return { isValid: false, error: 'Day is required' }
  }

  // Normalize case
  const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()

  if (!validDays.includes(normalized)) {
    return { isValid: false, error: `Day must be one of: ${validDays.join(', ')}` }
  }

  return { isValid: true }
}

// ============================================================================
// FORM VALIDATORS
// ============================================================================

/**
 * Login Form Validation
 */
export interface LoginFormData {
  email: string
  password: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateLoginForm(data: LoginFormData): FormValidationResult {
  const errors: Record<string, string> = {}

  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.error || 'Invalid email'
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Signup Form Validation
 */
export interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function validateSignupForm(data: SignupFormData): FormValidationResult {
  const errors: Record<string, string> = {}

  // Validate name
  const nameResult = validatePersonName(data.name)
  if (!nameResult.isValid) {
    errors.name = nameResult.error || 'Invalid name'
  }

  // Validate email
  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.error || 'Invalid email'
  }

  // Validate password
  const passwordResult = validatePassword(data.password)
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error || 'Invalid password'
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Student Form Validation
 */
export interface StudentFormDataInput {
  firstName: string
  lastName: string
  middleName?: string
  email: string
  studentNumber: string
  yearLevel: number | string
  section: string
  contact?: string
  birthdate?: string
  status?: string
  nfcId?: string
  guardianContact?: string
}

export function validateStudentForm(data: StudentFormDataInput): FormValidationResult {
  const errors: Record<string, string> = {}

  // Required fields
  const firstNameResult = validatePersonName(data.firstName)
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.error || 'Invalid first name'
  }

  const lastNameResult = validatePersonName(data.lastName)
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.error || 'Invalid last name'
  }

  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.error || 'Invalid email'
  }

  const studentNumberResult = validateStudentNumber(data.studentNumber)
  if (!studentNumberResult.isValid) {
    errors.studentNumber = studentNumberResult.error || 'Invalid student number'
  }

  const yearLevel =
    typeof data.yearLevel === 'string' ? parseInt(data.yearLevel, 10) : data.yearLevel
  const yearLevelResult = validateYearLevel(yearLevel)
  if (!yearLevelResult.isValid) {
    errors.yearLevel = yearLevelResult.error || 'Invalid year level'
  }

  const sectionResult = validateSection(data.section)
  if (!sectionResult.isValid) {
    errors.section = sectionResult.error || 'Invalid section'
  }

  // Optional fields
  if (data.middleName) {
    const middleNameResult = validatePersonName(data.middleName)
    if (!middleNameResult.isValid) {
      errors.middleName = middleNameResult.error || 'Invalid middle name'
    }
  }

  if (data.contact) {
    const contactResult = validateContact(data.contact)
    if (!contactResult.isValid) {
      errors.contact = contactResult.error || 'Invalid contact'
    }
  }

  if (data.birthdate) {
    const birthdateResult = validateBirthdate(data.birthdate)
    if (!birthdateResult.isValid) {
      errors.birthdate = birthdateResult.error || 'Invalid birthdate'
    }
  }

  if (data.status) {
    const statusResult = validateStudentStatus(data.status)
    if (!statusResult.isValid) {
      errors.status = statusResult.error || 'Invalid status'
    }
  }

  if (data.nfcId) {
    const nfcIdResult = validateNfcId(data.nfcId)
    if (!nfcIdResult.isValid) {
      errors.nfcId = nfcIdResult.error || 'Invalid NFC ID'
    }
  }

  if (data.guardianContact) {
    const guardianContactResult = validateContact(data.guardianContact)
    if (!guardianContactResult.isValid) {
      errors.guardianContact = guardianContactResult.error || 'Invalid guardian contact'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Subject Form Validation
 */
export interface SubjectFormDataInput {
  name: string
  code: string
  description?: string
  instructor?: string
  room?: string
  capacity?: number | string
}

export function validateSubjectForm(data: SubjectFormDataInput): FormValidationResult {
  const errors: Record<string, string> = {}

  // Required fields
  const nameResult = validateSubjectName(data.name)
  if (!nameResult.isValid) {
    errors.name = nameResult.error || 'Invalid subject name'
  }

  const codeResult = validateSubjectCode(data.code)
  if (!codeResult.isValid) {
    errors.code = codeResult.error || 'Invalid subject code'
  }

  // Optional fields
  if (data.description) {
    const descResult = validateDescription(data.description)
    if (!descResult.isValid) {
      errors.description = descResult.error || 'Invalid description'
    }
  }

  if (data.instructor) {
    const instructorResult = validateInstructorName(data.instructor)
    if (!instructorResult.isValid) {
      errors.instructor = instructorResult.error || 'Invalid instructor name'
    }
  }

  if (data.room) {
    const roomResult = validateRoomNumber(data.room)
    if (!roomResult.isValid) {
      errors.room = roomResult.error || 'Invalid room'
    }
  }

  if (data.capacity !== undefined && data.capacity !== '') {
    const capacityNum =
      typeof data.capacity === 'string' ? parseInt(data.capacity, 10) : data.capacity
    const capacityResult = validateCapacity(capacityNum)
    if (!capacityResult.isValid) {
      errors.capacity = capacityResult.error || 'Invalid capacity'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// ============================================================================
// EXPORT ALL VALIDATORS
// ============================================================================

export const validators = {
  // Student
  studentNumber: validateStudentNumber,
  personName: validatePersonName,
  age: validateAge,
  birthdate: validateBirthdate,
  contact: validateContact,
  email: validateEmail,
  schoolEmail: validateSchoolEmail,
  studentStatus: validateStudentStatus,

  // Subject/Course
  subjectCode: validateSubjectCode,
  subjectName: validateSubjectName,
  section: validateSection,
  yearLevel: validateYearLevel,
  capacity: validateCapacity,
  description: validateDescription,
  instructorName: validateInstructorName,
  roomNumber: validateRoomNumber,

  // Attendance
  attendanceStatus: validateAttendanceStatus,
  attendanceTimestamp: validateAttendanceTimestamp,
  attendanceDate: validateAttendanceDate,
  notes: validateNotes,

  // NFC/ID Card
  nfcId: validateNfcId,
  cardNumber: validateCardNumber,

  // Auth
  password: validatePassword,
  passwordConfirmation: validatePasswordConfirmation,
  passwordStrength: validatePasswordStrength,
  otp: validateOtp,
  username: validateUsername,

  // Files
  fileSize: validateFileSize,
  fileType: validateFileType,
  filename: validateFilename,
  profilePhoto: validateProfilePhoto,
  document: validateDocument,
  excelFile: validateExcelFile,

  // Search/Filter
  searchTerm: validateSearchTerm,
  dateRange: validateDateRange,
  id: validateId,

  // Schedule
  timeFormat: validateTimeFormat,
  scheduleTimeRange: validateScheduleTimeRange,
  dayOfWeek: validateDayOfWeek,
}

/**
 * Sanitize name (person or subject name)
 */
function sanitizeName(value: string): string {
  return normalizeWhitespace(escapeHtml(trimString(value)))
}

/**
 * Sanitize subject code (uppercase, trimmed)
 */
function sanitizeSubjectCode(value: string): string {
  return trimString(value).toUpperCase()
}

/**
 * Sanitize general text content
 */
function sanitizeText(value: string): string {
  return normalizeWhitespace(escapeHtml(trimString(value)))
}

export const sanitizers = {
  trim: trimString,
  normalizeWhitespace,
  escapeHtml,
  input: sanitizeInput,
  search: sanitizeSearch,
  email: sanitizeEmail,
  phone: sanitizePhone,
  name: sanitizeName,
  subjectCode: sanitizeSubjectCode,
  text: sanitizeText,
}
