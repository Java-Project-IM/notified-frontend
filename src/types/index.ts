// ============================================================================
// ATTENDANCE TYPES - Export from separate file
// ============================================================================
export * from './attendance.types'

// ============================================================================
// SUBJECT TYPES - Export from separate file
// ============================================================================
export * from './subject.types'

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

/**
 * User role types for authorization
 * - professor: Can view subjects, mark attendance, view students
 * - registrar: Full student/enrollment management
 * - admin: Full system access
 * - superadmin: Full system access (legacy alias for admin)
 * - staff: Limited view-only access (legacy)
 */
export type UserRole = 'professor' | 'registrar' | 'admin' | 'superadmin' | 'staff'

/**
 * User entity from the authentication system
 */
export interface User {
  readonly id: number
  name: string
  email: string
  role: UserRole
}

/**
 * Authentication response from login/signup endpoints
 */
export interface AuthResponse {
  user: User
  accessToken: string
  token?: string // Legacy support for backward compatibility
}

/**
 * Login credentials payload
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Signup data payload
 */
export interface SignupData {
  name: string
  email: string
  password: string
}

// ============================================================================
// STUDENT TYPES
// ============================================================================

/**
 * Student status types
 */
export type StudentStatus =
  | 'active'
  | 'inactive'
  | 'graduated'
  | 'transferred'
  | 'suspended'
  | 'dropped'

/**
 * Student entity with all database fields
 */
export interface Student {
  readonly id: number
  studentNumber: string // Format: YY-NNNN (e.g., 24-0001)
  firstName: string // Min 2, Max 50 characters
  lastName: string // Min 2, Max 50 characters
  email: string // Valid email format
  birthdate?: string // ISO 8601 date string (YYYY-MM-DD)
  age?: number // Calculated from birthdate (3-100)
  contact?: string // Phone number (10-15 digits)
  status?: StudentStatus // Student enrollment status
  section?: string // Optional, alphanumeric
  guardianName?: string // Optional, min 2 characters if provided
  guardianEmail?: string // Optional, valid email if provided
  guardianContact?: string // Optional, guardian phone number
  nfcId?: string // Optional, NFC card ID (hex string)
  profilePhoto?: string // Optional, URL to profile photo
  createdAt: string // ISO 8601 date string
  updatedAt?: string // ISO 8601 date string
}

/**
 * Form data for creating or updating a student
 */
export interface StudentFormData {
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  birthdate?: string
  contact?: string
  status?: StudentStatus
  section?: string
  guardianName?: string
  guardianEmail?: string
  guardianContact?: string
  nfcId?: string
}

// ============================================================================
// SUBJECT TYPES (BASIC - Extended types in subject.types.ts)
// ============================================================================

/**
 * Subject entity with all database fields
 */
export interface Subject {
  readonly id: string | number
  subjectCode: string // Format: e.g., "CS101", "MATH201"
  subjectName: string
  section: string
  yearLevel: number // 1-12 for grade/year levels
  capacity?: number // Maximum enrollment capacity (1-500)
  description?: string // Optional subject description
  instructor?: string // Optional instructor name
  room?: string // Optional room/location
  createdAt: string // ISO 8601 date string
  updatedAt?: string // ISO 8601 date string
}

/**
 * Form data for creating or updating a subject
 */
export interface SubjectFormData {
  subjectCode: string
  subjectName: string
  section: string
  yearLevel: number
  capacity?: number
  description?: string
  instructor?: string
  room?: string
}

// ============================================================================
// RECORD TYPES
// ============================================================================

/**
 * Record type discriminated union
 */
export type RecordType = 'arrival' | 'departure' | 'email_sent' | 'Arrival' | 'Departure'

/**
 * Attendance/notification record entity
 */
export interface Record {
  readonly id: number
  studentId: number
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  recordType: RecordType
  createdAt: string // ISO 8601 date string
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * Dashboard statistics overview
 */
export interface DashboardStats {
  totalStudents: number
  totalSubjects: number
  totalRecords: number
  todayRecords: number
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

/**
 * Email data payload for sending emails
 */
export interface EmailData {
  to: string | string[]
  subject: string
  message: string
  attachments?: File[]
}

/**
 * Email configuration response
 */
export interface EmailConfig {
  configured: boolean
  provider?: string
  fromEmail?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string
  status: number
  code?: string
  errors?: { [key: string]: string[] }
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast notification data structure
 */
export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

/**
 * Form validation error structure
 */
export type FormErrors<T> = {
  [K in keyof T]?: string
}

/**
 * Loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string' &&
    'status' in error &&
    typeof (error as ApiError).status === 'number'
  )
}

/**
 * Type guard to check if an error has a response property (Axios error)
 */
export function isAxiosError(
  error: unknown
): error is { response: { status: number; data: unknown } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response === 'object'
  )
}

/**
 * Type guard to check if it's a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message === 'Failed to fetch' || error.message === 'Network request failed')
  )
}
