// ============================================================================
// SUBJECT MANAGEMENT TYPES (ENHANCED)
// ============================================================================

/**
 * Subject schedule slot configuration
 */
export interface SubjectScheduleSlot {
  slotName: string // e.g., "Lecture", "Laboratory", "Tutorial"
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[]
  startTime: string // HH:mm format (e.g., "09:00")
  endTime: string // HH:mm format (e.g., "10:30")
  room?: string
  building?: string
}

/**
 * Legacy subject schedule configuration (for backward compatibility)
 */
export interface SubjectSchedule {
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[]
  startTime: string // HH:mm format (e.g., "09:00")
  endTime: string // HH:mm format (e.g., "10:30")
  room?: string
  building?: string
}

/**
 * Enrolled student in a subject
 */
export interface EnrolledStudent {
  readonly id: string | number
  studentId: string | number
  subjectId: string | number
  enrolledAt: string
  student?: {
    id: string | number
    _id?: string // MongoDB ObjectId
    studentNumber: string
    firstName: string
    lastName: string
    email: string
    section?: string
    guardianName?: string
    guardianEmail?: string
  }
}

/**
 * Subject entity with enhanced fields
 */
export interface SubjectEnhanced {
  readonly id: string | number
  subjectCode: string
  subjectName: string
  section: string
  yearLevel: number
  schedule?: SubjectSchedule // Legacy single schedule
  schedules?: SubjectScheduleSlot[] // New multiple schedules support
  enrolledStudents?: EnrolledStudent[]
  enrollmentCount?: number
  createdAt: string
  updatedAt?: string
}

/**
 * Form data for subject enrollment
 */
export interface EnrollmentFormData {
  subjectId: string | number
  studentId: number
}

/**
 * Bulk enrollment data
 */
export interface BulkEnrollmentData {
  subjectId: string | number
  studentIds: number[]
}

/**
 * Subject attendance data
 */
export interface SubjectAttendanceData {
  subjectId: string | number
  studentId: string | number
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  timeSlot?: 'arrival' | 'departure'
  scheduleSlot?: string // Name of the schedule slot (e.g., "Lecture", "Laboratory")
  notes?: string
}

/**
 * Bulk subject attendance data
 */
export interface BulkSubjectAttendanceData {
  subjectId: string | number
  studentIds: (string | number)[]
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  timeSlot?: 'arrival' | 'departure'
  scheduleSlot?: string // Name of the schedule slot
  notes?: string
}

/**
 * Subject attendance summary
 */
export interface SubjectAttendanceSummaryEnhanced {
  subjectId: string | number
  subjectCode: string
  subjectName: string
  section: string
  date: string
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  records: {
    studentId: number
    studentNumber: string
    studentName: string
    status: 'present' | 'absent' | 'late' | 'excused'
    markedAt?: string
  }[]
}

/**
 * Student subject attendance history
 */
export interface StudentSubjectAttendance {
  studentId: number
  studentNumber: string
  studentName: string
  subjectId: string | number
  subjectCode: string
  subjectName: string
  totalSessions: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: number
  recentRecords: {
    date: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }[]
}
