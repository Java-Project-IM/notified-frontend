// ============================================================================
// ATTENDANCE MANAGEMENT TYPES
// ============================================================================

/**
 * Attendance status types
 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

/**
 * Time slot for arrival/departure tracking
 */
export type TimeSlot = 'arrival' | 'departure'

/**
 * Attendance record with student information
 */
export interface AttendanceRecord {
  readonly id: string | number
  studentId: string | number
  studentNumber?: string
  firstName?: string
  lastName?: string
  email?: string
  subjectId?: string | number
  subjectCode?: string
  subjectName?: string
  status: AttendanceStatus
  timeSlot?: TimeSlot
  scheduleSlot?: string
  timestamp?: string // ISO 8601 date string
  date?: string // ISO 8601 date string (alternative to timestamp)
  notes?: string
  remarks?: string // backend field name
  createdAt: string
  updatedAt?: string
  // Populated student object (from backend)
  student?: {
    _id?: string
    id?: string | number
    studentNumber: string
    firstName: string
    lastName: string
    email: string
    section?: string
    guardianEmail?: string
  }
}

/**
 * Attendance form data for creating/updating records
 */
export interface AttendanceFormData {
  studentId: string | number
  subjectId?: string | number
  status: AttendanceStatus
  timeSlot?: TimeSlot
  timestamp?: string
  notes?: string
}

/**
 * Bulk attendance data for multiple students
 */
export interface BulkAttendanceData {
  studentIds: number[]
  subjectId?: string | number
  status: AttendanceStatus
  timeSlot: TimeSlot
  timestamp?: string
  notes?: string
}

/**
 * Attendance summary statistics
 */
export interface AttendanceSummary {
  date: string
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  arrivalCount: number
  departureCount: number
}

/**
 * Daily attendance summary by student
 */
export interface StudentAttendanceSummary {
  studentId: number
  studentNumber: string
  studentName: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
  lastAttendance?: string
}

/**
 * Subject attendance summary
 */
export interface SubjectAttendanceSummary {
  subjectId: string | number
  subjectCode: string
  subjectName: string
  section: string
  totalSessions: number
  averageAttendance: number
  totalStudents: number
  activeStudents: number
}

/**
 * Date range filter for attendance queries
 */
export interface AttendanceDateRange {
  startDate: string
  endDate: string
}

/**
 * Attendance filter options
 */
export interface AttendanceFilters {
  status?: AttendanceStatus
  timeSlot?: TimeSlot
  studentId?: number
  subjectId?: string | number
  dateRange?: AttendanceDateRange
  searchTerm?: string
}

/**
 * Excel import result
 */
export interface ImportResult {
  success: number
  failed: number
  errors: ImportError[]
  imported: AttendanceRecord[]
}

/**
 * Excel import error details
 */
export interface ImportError {
  row: number
  field?: string
  message: string
  data?: any
}

/**
 * Predefined message templates
 */
export interface MessageTemplate {
  id: string
  type: 'arrival' | 'departure'
  title: string
  message: string
  variables?: string[] // e.g., ['studentName', 'time', 'date']
}

/**
 * Message template variables for dynamic content
 */
export interface MessageVariables {
  studentName: string
  studentNumber: string
  date: string
  time: string
  subject?: string
  status?: string
}
