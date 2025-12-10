import apiClient from './api'
import { sanitizeString } from '@/utils/validation'
import { validators, sanitizers, VALIDATION_RULES } from '@/utils/validation-rules'

interface Attendance {
  id: number
  studentId: number
  subjectId: string | number
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface AttendanceFormData {
  studentId: number
  subjectId: string | number
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
}

interface AttendanceSummary {
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

interface TodayAttendanceStats {
  present: number
  absent: number
  late: number
  excused: number
  unmarked: number
  total: number
  attendanceRate: number
}

/**
 * Validate attendance status
 */
function validateAttendanceStatus(status: string): { isValid: boolean; error?: string } {
  const validStatuses = VALIDATION_RULES.ATTENDANCE.STATUS.ALLOWED_VALUES
  if (!validStatuses.includes(status as 'present' | 'absent' | 'late' | 'excused')) {
    return {
      isValid: false,
      error: `Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`,
    }
  }
  return { isValid: true }
}

/**
 * Validate attendance date (not in future)
 */
function validateAttendanceDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr || dateStr.trim().length === 0) {
    return { isValid: false, error: 'Attendance date is required' }
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' }
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date value' }
  }

  // Check if date is in the future
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  if (date > today) {
    return { isValid: false, error: 'Attendance date cannot be in the future' }
  }

  // Check reasonable past limit (e.g., 1 year ago)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  if (date < oneYearAgo) {
    return { isValid: false, error: 'Attendance date cannot be more than 1 year in the past' }
  }

  return { isValid: true }
}

/**
 * Validate attendance notes
 */
function validateAttendanceNotes(notes: string): { isValid: boolean; error?: string } {
  const { MAX_LENGTH, ALLOWED_PATTERN, BLOCKED_PATTERN } = VALIDATION_RULES.ATTENDANCE.NOTES

  if (notes.length > MAX_LENGTH) {
    return { isValid: false, error: `Notes must be ${MAX_LENGTH} characters or less` }
  }

  if (!ALLOWED_PATTERN.test(notes)) {
    return { isValid: false, error: 'Notes contain invalid characters' }
  }

  if (BLOCKED_PATTERN.test(notes)) {
    return { isValid: false, error: 'Notes contain blocked content' }
  }

  return { isValid: true }
}

/**
 * Sanitize attendance form data
 */
function sanitizeAttendanceData(data: AttendanceFormData): AttendanceFormData {
  return {
    studentId: data.studentId,
    subjectId: data.subjectId,
    date: data.date.trim(),
    status: data.status,
    notes: data.notes ? sanitizeString(data.notes) : undefined,
  }
}

export const attendanceService = {
  async getAll(): Promise<Attendance[]> {
    const response = await apiClient.get<Attendance[]>('/attendance')
    return response.data
  },

  async getToday(): Promise<Attendance[]> {
    const response = await apiClient.get<Attendance[]>('/attendance/today')
    return response.data
  },

  async getSummary(): Promise<AttendanceSummary> {
    const response = await apiClient.get<AttendanceSummary>('/attendance/summary')
    return response.data
  },

  /**
   * Get today's attendance breakdown stats
   * Calculates present/absent/late/excused counts from today's records
   */
  async getTodayStats(): Promise<TodayAttendanceStats> {
    try {
      const todayRecords = await this.getToday()

      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        unmarked: 0,
        total: todayRecords.length,
        attendanceRate: 0,
      }

      todayRecords.forEach((record) => {
        switch (record.status) {
          case 'present':
            stats.present++
            break
          case 'absent':
            stats.absent++
            break
          case 'late':
            stats.late++
            break
          case 'excused':
            stats.excused++
            break
        }
      })

      // Calculate attendance rate (present + late + excused = attended)
      const attended = stats.present + stats.late + stats.excused
      stats.attendanceRate = stats.total > 0 ? Math.round((attended / stats.total) * 100) : 0

      return stats
    } catch (error) {
      // Return default stats on error
      return {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        unmarked: 0,
        total: 0,
        attendanceRate: 0,
      }
    }
  },

  async getById(id: number): Promise<Attendance> {
    // Validate ID
    if (!id || id <= 0) {
      throw new Error('Valid attendance ID is required')
    }

    const response = await apiClient.get<Attendance>(`/attendance/${id}`)
    return response.data
  },

  async getByStudent(studentId: number): Promise<Attendance[]> {
    // Validate student ID
    if (!studentId || studentId <= 0) {
      throw new Error('Valid student ID is required')
    }

    const response = await apiClient.get<Attendance[]>(`/attendance/student/${studentId}`)
    return response.data
  },

  async getBySubject(subjectId: string | number): Promise<Attendance[]> {
    // Validate subject ID
    const idStr = String(subjectId)
    if (!idStr || idStr.trim().length === 0) {
      throw new Error('Subject ID is required')
    }

    const response = await apiClient.get<Attendance[]>(`/attendance/subject/${subjectId}`)
    return response.data
  },

  async create(data: AttendanceFormData): Promise<Attendance> {
    // Validate required fields
    if (!data.studentId || data.studentId <= 0) {
      throw new Error('Valid student ID is required')
    }

    if (!data.subjectId) {
      throw new Error('Subject ID is required')
    }

    // Validate date (not in future)
    const dateValidation = validateAttendanceDate(data.date)
    if (!dateValidation.isValid) {
      throw new Error(dateValidation.error)
    }

    // Validate status
    const statusValidation = validateAttendanceStatus(data.status)
    if (!statusValidation.isValid) {
      throw new Error(statusValidation.error)
    }

    // Validate notes if provided
    if (data.notes) {
      const notesValidation = validateAttendanceNotes(data.notes)
      if (!notesValidation.isValid) {
        throw new Error(notesValidation.error)
      }
    }

    // Sanitize data before submission
    const sanitizedData = sanitizeAttendanceData(data)

    const response = await apiClient.post<Attendance>('/attendance', sanitizedData)
    return response.data
  },

  async update(id: number | string, data: Partial<AttendanceFormData>): Promise<Attendance> {
    // Validate ID
    const idNum = typeof id === 'string' ? parseInt(id, 10) : id
    if (!idNum || idNum <= 0 || isNaN(idNum)) {
      throw new Error('Valid attendance ID is required')
    }

    // Validate date if provided
    if (data.date !== undefined) {
      const dateValidation = validateAttendanceDate(data.date)
      if (!dateValidation.isValid) {
        throw new Error(dateValidation.error)
      }
    }

    // Validate status if provided
    if (data.status !== undefined) {
      const statusValidation = validateAttendanceStatus(data.status)
      if (!statusValidation.isValid) {
        throw new Error(statusValidation.error)
      }
    }

    // Validate notes if provided
    if (data.notes !== undefined && data.notes) {
      const notesValidation = validateAttendanceNotes(data.notes)
      if (!notesValidation.isValid) {
        throw new Error(notesValidation.error)
      }
    }

    // Sanitize data
    const sanitizedData: Partial<AttendanceFormData> = {}
    if (data.studentId !== undefined) sanitizedData.studentId = data.studentId
    if (data.subjectId !== undefined) sanitizedData.subjectId = data.subjectId
    if (data.date !== undefined) sanitizedData.date = data.date.trim()
    if (data.status !== undefined) sanitizedData.status = data.status
    if (data.notes !== undefined)
      sanitizedData.notes = data.notes ? sanitizeString(data.notes) : undefined

    const response = await apiClient.put<Attendance>(`/attendance/${id}`, sanitizedData)
    return response.data
  },

  async delete(id: number): Promise<void> {
    // Validate ID
    if (!id || id <= 0) {
      throw new Error('Valid attendance ID is required')
    }

    await apiClient.delete(`/attendance/${id}`)
  },
}
