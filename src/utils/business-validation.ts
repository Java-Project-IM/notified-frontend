// ============================================================================
// BUSINESS LOGIC VALIDATIONS
// ============================================================================
// This module provides business-level validation rules that go beyond
// simple field validation to enforce business constraints

import { ValidationResult } from './validation'
import {
  validateStudentNumber,
  validateEmail,
  validateBirthdate,
  validateAttendanceTimestamp,
  validateCapacity,
  calculateAge,
  VALIDATION_CONSTANTS,
} from './validation-rules'

// ============================================================================
// TYPES FOR BUSINESS VALIDATION
// ============================================================================

export interface StudentData {
  id?: number | string
  studentNumber: string
  email: string
  firstName?: string
  lastName?: string
  birthdate?: string
  age?: number
  status?: string
}

export interface SubjectData {
  id?: number | string
  subjectCode: string
  capacity?: number
  enrolledCount?: number
}

export interface AttendanceData {
  studentId: number | string
  subjectId?: number | string
  timestamp?: string
  date?: string
  status: string
}

export interface EnrollmentData {
  studentId: number | string
  subjectId: number | string
}

export interface DeletionCheckResult {
  canDelete: boolean
  reason?: string
  relatedEntities?: string[]
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check if student number already exists
 * @param studentNumber - The student number to check
 * @param existingStudents - Array of existing students
 * @param excludeId - ID to exclude (for updates)
 */
export function checkDuplicateStudentNumber(
  studentNumber: string,
  existingStudents: StudentData[],
  excludeId?: number | string
): ValidationResult {
  const normalizedNumber = studentNumber.trim().toLowerCase()

  const duplicate = existingStudents.find((student) => {
    // Exclude current student when updating
    if (excludeId && (student.id === excludeId || String(student.id) === String(excludeId))) {
      return false
    }
    return student.studentNumber.toLowerCase() === normalizedNumber
  })

  if (duplicate) {
    return {
      isValid: false,
      error: `Student number "${studentNumber}" is already assigned to another student`,
    }
  }

  return { isValid: true }
}

/**
 * Check if email already exists
 * @param email - The email to check
 * @param existingUsers - Array of existing users/students
 * @param excludeId - ID to exclude (for updates)
 */
export function checkDuplicateEmail(
  email: string,
  existingUsers: { id?: number | string; email: string }[],
  excludeId?: number | string
): ValidationResult {
  const normalizedEmail = email.trim().toLowerCase()

  const duplicate = existingUsers.find((user) => {
    if (excludeId && (user.id === excludeId || String(user.id) === String(excludeId))) {
      return false
    }
    return user.email.toLowerCase() === normalizedEmail
  })

  if (duplicate) {
    return {
      isValid: false,
      error: `Email "${email}" is already registered`,
    }
  }

  return { isValid: true }
}

/**
 * Check if subject code already exists
 * @param subjectCode - The subject code to check
 * @param existingSubjects - Array of existing subjects
 * @param excludeId - ID to exclude (for updates)
 */
export function checkDuplicateSubjectCode(
  subjectCode: string,
  existingSubjects: SubjectData[],
  excludeId?: number | string
): ValidationResult {
  const normalizedCode = subjectCode.trim().toUpperCase()

  const duplicate = existingSubjects.find((subject) => {
    if (excludeId && (subject.id === excludeId || String(subject.id) === String(excludeId))) {
      return false
    }
    return subject.subjectCode.toUpperCase() === normalizedCode
  })

  if (duplicate) {
    return {
      isValid: false,
      error: `Subject code "${subjectCode}" already exists`,
    }
  }

  return { isValid: true }
}

/**
 * Check if NFC ID already exists
 * @param nfcId - The NFC ID to check
 * @param existingCards - Array of existing cards
 * @param excludeId - ID to exclude (for updates)
 */
export function checkDuplicateNfcId(
  nfcId: string,
  existingCards: { id?: number | string; nfcId: string }[],
  excludeId?: number | string
): ValidationResult {
  const normalizedNfc = nfcId.trim().toUpperCase()

  const duplicate = existingCards.find((card) => {
    if (excludeId && (card.id === excludeId || String(card.id) === String(excludeId))) {
      return false
    }
    return card.nfcId.toUpperCase() === normalizedNfc
  })

  if (duplicate) {
    return {
      isValid: false,
      error: `NFC ID "${nfcId}" is already assigned to another card`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// AGE / BIRTHDATE CONSISTENCY
// ============================================================================

/**
 * Validate that age matches birthdate
 * @param age - Provided age
 * @param birthdate - Provided birthdate
 * @param tolerance - Allowed tolerance in days (for birthday edge cases)
 */
export function validateAgeMatchesBirthdate(
  age: number,
  birthdate: string,
  tolerance: number = 1
): ValidationResult {
  // First validate the birthdate
  const birthdateResult = validateBirthdate(birthdate)
  if (!birthdateResult.isValid) {
    return birthdateResult
  }

  const birthdateObj = new Date(birthdate)
  const calculatedAge = calculateAge(birthdateObj)

  // Allow for birthday edge cases (±1 year due to when form was filled)
  if (Math.abs(calculatedAge - age) > tolerance) {
    return {
      isValid: false,
      error: `Age (${age}) does not match birthdate. Expected age: ${calculatedAge}`,
    }
  }

  return { isValid: true }
}

/**
 * Auto-calculate age from birthdate
 * Returns calculated age or null if birthdate is invalid
 */
export function getAgeFromBirthdate(birthdate: string): number | null {
  const result = validateBirthdate(birthdate)
  if (!result.isValid) {
    return null
  }
  return calculateAge(new Date(birthdate))
}

// ============================================================================
// ATTENDANCE BUSINESS RULES
// ============================================================================

/**
 * Validate attendance timestamp is not in the future
 * Wrapper with additional business logic
 */
export function validateAttendanceTime(timestamp: string): ValidationResult {
  return validateAttendanceTimestamp(timestamp)
}

/**
 * Check if attendance already exists for student on date
 * @param studentId - Student ID
 * @param date - Date string
 * @param subjectId - Optional subject ID
 * @param existingRecords - Existing attendance records
 */
export function checkDuplicateAttendance(
  studentId: number | string,
  date: string,
  existingRecords: AttendanceData[],
  subjectId?: number | string
): ValidationResult {
  const dateStr = date.split('T')[0] // Normalize to date only

  const duplicate = existingRecords.find((record) => {
    const recordDate = (record.date || record.timestamp)?.split('T')[0]
    const studentMatch = String(record.studentId) === String(studentId)
    const dateMatch = recordDate === dateStr

    if (subjectId) {
      return studentMatch && dateMatch && String(record.subjectId) === String(subjectId)
    }
    return studentMatch && dateMatch
  })

  if (duplicate) {
    return {
      isValid: false,
      error: `Attendance record already exists for this student on ${dateStr}${
        subjectId ? ' for this subject' : ''
      }`,
    }
  }

  return { isValid: true }
}

/**
 * Validate attendance can be marked for a date (not too far in past)
 * @param date - Date to validate
 * @param maxDaysBack - Maximum days in the past allowed
 */
export function validateAttendanceDateRange(
  date: string,
  maxDaysBack: number = 30
): ValidationResult {
  const attendanceDate = new Date(date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  // Can't be in future
  if (attendanceDate > today) {
    return { isValid: false, error: 'Cannot mark attendance for future dates' }
  }

  // Check if too far in past
  const daysAgo = Math.floor((today.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysAgo > maxDaysBack) {
    return {
      isValid: false,
      error: `Cannot modify attendance older than ${maxDaysBack} days`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// COURSE CAPACITY LIMITS
// ============================================================================

/**
 * Check if course has reached capacity
 * @param subject - Subject data with capacity and enrolled count
 */
export function checkCourseCapacity(subject: SubjectData): ValidationResult {
  if (!subject.capacity) {
    return { isValid: true } // No capacity limit set
  }

  const enrolled = subject.enrolledCount || 0
  if (enrolled >= subject.capacity) {
    return {
      isValid: false,
      error: `Course is at full capacity (${enrolled}/${subject.capacity} enrolled)`,
    }
  }

  return { isValid: true }
}

/**
 * Validate enrollment capacity before adding student
 * @param subject - Subject data
 * @param additionalStudents - Number of students to add (default 1)
 */
export function validateEnrollmentCapacity(
  subject: SubjectData,
  additionalStudents: number = 1
): ValidationResult {
  if (!subject.capacity) {
    return { isValid: true }
  }

  const enrolled = subject.enrolledCount || 0
  const newTotal = enrolled + additionalStudents

  if (newTotal > subject.capacity) {
    const available = subject.capacity - enrolled
    return {
      isValid: false,
      error: `Cannot enroll ${additionalStudents} student(s). Only ${available} spot(s) available (capacity: ${subject.capacity})`,
    }
  }

  return { isValid: true }
}

/**
 * Validate capacity update doesn't go below current enrollment
 */
export function validateCapacityUpdate(
  newCapacity: number,
  currentEnrollment: number
): ValidationResult {
  const capacityResult = validateCapacity(newCapacity)
  if (!capacityResult.isValid) {
    return capacityResult
  }

  if (newCapacity < currentEnrollment) {
    return {
      isValid: false,
      error: `Cannot set capacity to ${newCapacity}. There are currently ${currentEnrollment} students enrolled`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// DELETION PREVENTION (REFERENTIAL INTEGRITY)
// ============================================================================

/**
 * Check if student can be deleted
 * @param studentId - Student ID to check
 * @param enrollments - List of enrollments
 * @param attendanceRecords - List of attendance records
 */
export function canDeleteStudent(
  studentId: number | string,
  enrollments: { studentId: number | string; subjectCode?: string }[],
  attendanceRecords: { studentId: number | string }[]
): DeletionCheckResult {
  const relatedEntities: string[] = []

  // Check enrollments
  const studentEnrollments = enrollments.filter((e) => String(e.studentId) === String(studentId))
  if (studentEnrollments.length > 0) {
    relatedEntities.push(`${studentEnrollments.length} subject enrollment(s)`)
  }

  // Check attendance records
  const studentAttendance = attendanceRecords.filter(
    (a) => String(a.studentId) === String(studentId)
  )
  if (studentAttendance.length > 0) {
    relatedEntities.push(`${studentAttendance.length} attendance record(s)`)
  }

  if (relatedEntities.length > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete student. Found related data: ${relatedEntities.join(', ')}. Consider setting status to "inactive" instead.`,
      relatedEntities,
    }
  }

  return { canDelete: true }
}

/**
 * Check if subject can be deleted
 * @param subjectId - Subject ID to check
 * @param enrollments - List of enrollments
 * @param attendanceRecords - List of attendance records
 */
export function canDeleteSubject(
  subjectId: number | string,
  enrollments: { subjectId: number | string }[],
  attendanceRecords: { subjectId?: number | string }[]
): DeletionCheckResult {
  const relatedEntities: string[] = []

  // Check enrollments
  const subjectEnrollments = enrollments.filter((e) => String(e.subjectId) === String(subjectId))
  if (subjectEnrollments.length > 0) {
    relatedEntities.push(`${subjectEnrollments.length} student enrollment(s)`)
  }

  // Check attendance records
  const subjectAttendance = attendanceRecords.filter(
    (a) => a.subjectId && String(a.subjectId) === String(subjectId)
  )
  if (subjectAttendance.length > 0) {
    relatedEntities.push(`${subjectAttendance.length} attendance record(s)`)
  }

  if (relatedEntities.length > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete subject. Found related data: ${relatedEntities.join(', ')}`,
      relatedEntities,
    }
  }

  return { canDelete: true }
}

/**
 * Check if user/admin can be deleted
 * @param userId - User ID to check
 * @param createdRecords - Records created by this user
 */
export function canDeleteUser(
  userId: number | string,
  createdRecords: { createdBy?: number | string }[]
): DeletionCheckResult {
  const userRecords = createdRecords.filter(
    (r) => r.createdBy && String(r.createdBy) === String(userId)
  )

  if (userRecords.length > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete user. They have created ${userRecords.length} record(s). Consider deactivating the account instead.`,
      relatedEntities: [`${userRecords.length} created record(s)`],
    }
  }

  return { canDelete: true }
}

// ============================================================================
// SECTION LEVEL VALIDATION
// ============================================================================

/**
 * Validate section level for high school (grades 7-12)
 */
export function validateHighSchoolLevel(level: number): ValidationResult {
  if (
    level < VALIDATION_CONSTANTS.SECTION_LEVEL_MIN ||
    level > VALIDATION_CONSTANTS.SECTION_LEVEL_MAX
  ) {
    return {
      isValid: false,
      error: `Grade level must be between ${VALIDATION_CONSTANTS.SECTION_LEVEL_MIN} and ${VALIDATION_CONSTANTS.SECTION_LEVEL_MAX}`,
    }
  }
  return { isValid: true }
}

/**
 * Validate year level for college (years 1-6)
 */
export function validateCollegeLevel(level: number): ValidationResult {
  if (
    level < VALIDATION_CONSTANTS.COLLEGE_YEAR_MIN ||
    level > VALIDATION_CONSTANTS.COLLEGE_YEAR_MAX
  ) {
    return {
      isValid: false,
      error: `College year must be between ${VALIDATION_CONSTANTS.COLLEGE_YEAR_MIN} and ${VALIDATION_CONSTANTS.COLLEGE_YEAR_MAX}`,
    }
  }
  return { isValid: true }
}

/**
 * Validate year/grade level based on institution type
 */
export function validateEducationLevel(
  level: number,
  institutionType: 'highschool' | 'college'
): ValidationResult {
  if (institutionType === 'highschool') {
    return validateHighSchoolLevel(level)
  }
  return validateCollegeLevel(level)
}

// ============================================================================
// SCHOOL DOMAIN EMAIL VALIDATION
// ============================================================================

/**
 * Validate email matches school domain (if configured)
 * @param email - Email to validate
 * @param schoolDomain - Required school domain (e.g., "school.edu")
 */
export function validateSchoolDomainEmail(email: string, schoolDomain?: string): ValidationResult {
  const emailResult = validateEmail(email)
  if (!emailResult.isValid) {
    return emailResult
  }

  if (!schoolDomain) {
    return { isValid: true } // No domain restriction
  }

  const emailDomain = email.split('@')[1]?.toLowerCase()
  const requiredDomain = schoolDomain.toLowerCase()

  if (!emailDomain?.endsWith(requiredDomain)) {
    return {
      isValid: false,
      error: `Email must be from the ${schoolDomain} domain`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// ENROLLMENT VALIDATION
// ============================================================================

/**
 * Check if student is already enrolled in subject
 */
export function checkDuplicateEnrollment(
  studentId: number | string,
  subjectId: number | string,
  existingEnrollments: EnrollmentData[]
): ValidationResult {
  const duplicate = existingEnrollments.find(
    (e) => String(e.studentId) === String(studentId) && String(e.subjectId) === String(subjectId)
  )

  if (duplicate) {
    return {
      isValid: false,
      error: 'Student is already enrolled in this subject',
    }
  }

  return { isValid: true }
}

/**
 * Validate student can be enrolled (status check)
 */
export function validateStudentCanEnroll(studentStatus: string): ValidationResult {
  const inactiveStatuses = ['inactive', 'graduated', 'transferred', 'suspended', 'dropped']

  if (inactiveStatuses.includes(studentStatus.toLowerCase())) {
    return {
      isValid: false,
      error: `Cannot enroll student with status "${studentStatus}". Student must be active.`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// BULK OPERATION VALIDATION
// ============================================================================

/**
 * Validate bulk operation limits
 */
export function validateBulkOperationSize(
  count: number,
  maxAllowed: number = 100
): ValidationResult {
  if (count === 0) {
    return { isValid: false, error: 'No items selected for bulk operation' }
  }

  if (count > maxAllowed) {
    return {
      isValid: false,
      error: `Bulk operation limit exceeded. Maximum ${maxAllowed} items allowed, got ${count}`,
    }
  }

  return { isValid: true }
}

/**
 * Validate bulk attendance data
 */
export function validateBulkAttendance(
  studentIds: (number | string)[],
  date: string,
  status: string
): ValidationResult {
  // Check size limit
  const sizeResult = validateBulkOperationSize(studentIds.length, 500)
  if (!sizeResult.isValid) return sizeResult

  // Check for duplicate student IDs
  const uniqueIds = new Set(studentIds.map(String))
  if (uniqueIds.size !== studentIds.length) {
    return { isValid: false, error: 'Duplicate student IDs found in bulk operation' }
  }

  return { isValid: true }
}

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Comprehensive student validation for create/update
 */
export function validateStudentData(
  data: StudentData,
  existingStudents: StudentData[],
  isUpdate: boolean = false
): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {}

  // Validate student number
  const studentNumberResult = validateStudentNumber(data.studentNumber)
  if (!studentNumberResult.isValid) {
    errors.studentNumber = studentNumberResult.error!
  }

  // Check duplicate student number
  const duplicateNumberResult = checkDuplicateStudentNumber(
    data.studentNumber,
    existingStudents,
    isUpdate ? data.id : undefined
  )
  if (!duplicateNumberResult.isValid) {
    errors.studentNumber = duplicateNumberResult.error!
  }

  // Validate email
  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.email = emailResult.error!
  }

  // Check duplicate email
  const duplicateEmailResult = checkDuplicateEmail(
    data.email,
    existingStudents,
    isUpdate ? data.id : undefined
  )
  if (!duplicateEmailResult.isValid) {
    errors.email = duplicateEmailResult.error!
  }

  // Validate age/birthdate consistency if both provided
  if (data.age !== undefined && data.birthdate) {
    const ageMatchResult = validateAgeMatchesBirthdate(data.age, data.birthdate)
    if (!ageMatchResult.isValid) {
      errors.age = ageMatchResult.error!
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Comprehensive subject validation for create/update
 */
export function validateSubjectData(
  data: SubjectData,
  existingSubjects: SubjectData[],
  isUpdate: boolean = false
): { isValid: boolean; errors: { [key: string]: string } } {
  const errors: { [key: string]: string } = {}

  // Check duplicate subject code
  const duplicateResult = checkDuplicateSubjectCode(
    data.subjectCode,
    existingSubjects,
    isUpdate ? data.id : undefined
  )
  if (!duplicateResult.isValid) {
    errors.subjectCode = duplicateResult.error!
  }

  // Validate capacity if updating and already has enrollments
  if (isUpdate && data.capacity && data.enrolledCount) {
    const capacityResult = validateCapacityUpdate(data.capacity, data.enrolledCount)
    if (!capacityResult.isValid) {
      errors.capacity = capacityResult.error!
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const businessValidators = {
  // Duplicate detection
  checkDuplicateStudentNumber,
  checkDuplicateEmail,
  checkDuplicateSubjectCode,
  checkDuplicateNfcId,
  checkDuplicateEnrollment,
  checkDuplicateAttendance,

  // Age/Birthdate
  validateAgeMatchesBirthdate,
  getAgeFromBirthdate,

  // Attendance
  validateAttendanceTime,
  validateAttendanceDateRange,

  // Capacity
  checkCourseCapacity,
  validateEnrollmentCapacity,
  validateCapacityUpdate,

  // Deletion
  canDeleteStudent,
  canDeleteSubject,
  canDeleteUser,

  // Education levels
  validateHighSchoolLevel,
  validateCollegeLevel,
  validateEducationLevel,

  // School domain
  validateSchoolDomainEmail,

  // Enrollment
  validateStudentCanEnroll,

  // Bulk operations
  validateBulkOperationSize,
  validateBulkAttendance,

  // Composite
  validateStudentData,
  validateSubjectData,
}
