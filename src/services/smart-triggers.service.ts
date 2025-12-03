import apiClient from './api'
import { logError } from '@/utils/errorHandling'

/**
 * Smart Triggers Service
 *
 * Provides automated alert triggers for attendance monitoring:
 * - Consecutive absence detection (3+ days)
 * - Low attendance rate warnings (<80%)
 * - Pattern analysis for early intervention
 *
 * @enterprise-grade Automated monitoring with configurable thresholds
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceAlert {
  id: string
  type: 'consecutive_absence' | 'low_attendance' | 'pattern_warning'
  severity: 'warning' | 'critical' | 'info'
  studentId: string
  studentName: string
  studentNumber: string
  subjectId?: string
  subjectName?: string
  message: string
  details: {
    consecutiveDays?: number
    attendanceRate?: number
    threshold?: number
    startDate?: string
    endDate?: string
  }
  acknowledged: boolean
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export interface AlertConfig {
  consecutiveAbsenceThreshold: number // Default: 3 days
  lowAttendanceThreshold: number // Default: 80%
  enableConsecutiveAlerts: boolean
  enableLowAttendanceAlerts: boolean
  enablePatternAlerts: boolean
  autoSendEmail: boolean
  emailRecipients: ('guardian' | 'student' | 'admin')[]
}

export interface StudentAttendanceAnalysis {
  studentId: string
  studentName: string
  studentNumber: string
  guardianEmail?: string
  overallRate: number
  consecutiveAbsences: number
  lastPresentDate?: string
  alerts: AttendanceAlert[]
  subjects: {
    subjectId: string
    subjectName: string
    attendanceRate: number
    consecutiveAbsences: number
  }[]
}

export interface AlertSummary {
  total: number
  critical: number
  warning: number
  unacknowledged: number
  byType: {
    consecutive_absence: number
    low_attendance: number
    pattern_warning: number
  }
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  consecutiveAbsenceThreshold: 3,
  lowAttendanceThreshold: 80,
  enableConsecutiveAlerts: true,
  enableLowAttendanceAlerts: true,
  enablePatternAlerts: true,
  autoSendEmail: false,
  emailRecipients: ['guardian'],
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const smartTriggersService = {
  /**
   * Get all active alerts
   */
  async getAlerts(filters?: {
    type?: AttendanceAlert['type']
    severity?: AttendanceAlert['severity']
    acknowledged?: boolean
    studentId?: string
    subjectId?: string
  }): Promise<AttendanceAlert[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.severity) params.append('severity', filters.severity)
      if (filters?.acknowledged !== undefined)
        params.append('acknowledged', filters.acknowledged.toString())
      if (filters?.studentId) params.append('studentId', filters.studentId)
      if (filters?.subjectId) params.append('subjectId', filters.subjectId)

      const response = await apiClient.get<{ data: AttendanceAlert[] }>(
        `/alerts?${params.toString()}`
      )
      return response.data.data || response.data
    } catch (error) {
      logError('SmartTriggersService', 'getAlerts', error)
      // Return empty array if endpoint not available yet
      return []
    }
  },

  /**
   * Get alert summary statistics
   */
  async getAlertSummary(): Promise<AlertSummary> {
    try {
      const response = await apiClient.get<{ data: AlertSummary }>('/alerts/summary')
      return (
        response.data.data || {
          total: 0,
          critical: 0,
          warning: 0,
          unacknowledged: 0,
          byType: {
            consecutive_absence: 0,
            low_attendance: 0,
            pattern_warning: 0,
          },
        }
      )
    } catch (error) {
      logError('SmartTriggersService', 'getAlertSummary', error)
      return {
        total: 0,
        critical: 0,
        warning: 0,
        unacknowledged: 0,
        byType: {
          consecutive_absence: 0,
          low_attendance: 0,
          pattern_warning: 0,
        },
      }
    }
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await apiClient.put(`/alerts/${alertId}/acknowledge`)
    } catch (error) {
      logError('SmartTriggersService', 'acknowledgeAlert', error)
      throw new Error('Failed to acknowledge alert')
    }
  },

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeMultiple(alertIds: string[]): Promise<void> {
    try {
      await apiClient.put('/alerts/acknowledge-multiple', { alertIds })
    } catch (error) {
      logError('SmartTriggersService', 'acknowledgeMultiple', error)
      throw new Error('Failed to acknowledge alerts')
    }
  },

  /**
   * Analyze student attendance and generate alerts
   * This runs client-side analysis when backend endpoint isn't available
   */
  async analyzeStudentAttendance(
    studentId: string,
    config: AlertConfig = DEFAULT_ALERT_CONFIG
  ): Promise<StudentAttendanceAnalysis> {
    try {
      const response = await apiClient.get<{ data: StudentAttendanceAnalysis }>(
        `/alerts/analyze/student/${studentId}`
      )
      return response.data.data
    } catch (error) {
      logError('SmartTriggersService', 'analyzeStudentAttendance', error)
      throw new Error('Failed to analyze student attendance')
    }
  },

  /**
   * Get students with consecutive absences
   */
  async getConsecutiveAbsences(threshold: number = 3): Promise<
    {
      studentId: string
      studentName: string
      consecutiveDays: number
      startDate: string
      subjects: string[]
    }[]
  > {
    try {
      const response = await apiClient.get<{ data: any[] }>(
        `/alerts/consecutive-absences?threshold=${threshold}`
      )
      return response.data.data || []
    } catch (error) {
      logError('SmartTriggersService', 'getConsecutiveAbsences', error)
      return []
    }
  },

  /**
   * Get students with low attendance rates
   */
  async getLowAttendance(threshold: number = 80): Promise<
    {
      studentId: string
      studentName: string
      attendanceRate: number
      totalClasses: number
      attendedClasses: number
    }[]
  > {
    try {
      const response = await apiClient.get<{ data: any[] }>(
        `/alerts/low-attendance?threshold=${threshold}`
      )
      return response.data.data || []
    } catch (error) {
      logError('SmartTriggersService', 'getLowAttendance', error)
      return []
    }
  },

  /**
   * Get alert configuration
   */
  async getConfig(): Promise<AlertConfig> {
    try {
      const response = await apiClient.get<{ data: AlertConfig }>('/alerts/config')
      return response.data.data || DEFAULT_ALERT_CONFIG
    } catch (error) {
      logError('SmartTriggersService', 'getConfig', error)
      return DEFAULT_ALERT_CONFIG
    }
  },

  /**
   * Update alert configuration
   */
  async updateConfig(config: Partial<AlertConfig>): Promise<AlertConfig> {
    try {
      const response = await apiClient.put<{ data: AlertConfig }>('/alerts/config', config)
      return response.data.data
    } catch (error) {
      logError('SmartTriggersService', 'updateConfig', error)
      throw new Error('Failed to update alert configuration')
    }
  },

  /**
   * Trigger manual alert scan
   * Scans all students and generates alerts based on current config
   */
  async runAlertScan(): Promise<{ newAlerts: number; scannedStudents: number }> {
    try {
      const response = await apiClient.post<{
        data: { newAlerts: number; scannedStudents: number }
      }>('/alerts/scan')
      return response.data.data
    } catch (error) {
      logError('SmartTriggersService', 'runAlertScan', error)
      throw new Error('Failed to run alert scan')
    }
  },

  /**
   * Send alert notification email
   */
  async sendAlertEmail(
    alertId: string,
    recipients: ('guardian' | 'student' | 'admin')[]
  ): Promise<void> {
    try {
      await apiClient.post(`/alerts/${alertId}/notify`, { recipients })
    } catch (error) {
      logError('SmartTriggersService', 'sendAlertEmail', error)
      throw new Error('Failed to send alert notification')
    }
  },

  /**
   * Dismiss/delete an alert
   */
  async dismissAlert(alertId: string): Promise<void> {
    try {
      await apiClient.delete(`/alerts/${alertId}`)
    } catch (error) {
      logError('SmartTriggersService', 'dismissAlert', error)
      throw new Error('Failed to dismiss alert')
    }
  },
}

// ============================================================================
// CLIENT-SIDE ALERT DETECTION UTILITIES
// ============================================================================

/**
 * Detect consecutive absences from attendance records
 * Use this when backend scanning isn't available
 */
export function detectConsecutiveAbsences(
  records: { date: string; status: string }[],
  threshold: number = 3
): { count: number; startDate: string | null; endDate: string | null } {
  // Sort records by date descending (most recent first)
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let consecutiveCount = 0
  let startDate: string | null = null
  let endDate: string | null = null

  for (const record of sorted) {
    if (record.status === 'absent') {
      consecutiveCount++
      if (!endDate) endDate = record.date
      startDate = record.date
    } else {
      // Break on first non-absent (including late, excused, present)
      break
    }
  }

  return {
    count: consecutiveCount,
    startDate: consecutiveCount >= threshold ? startDate : null,
    endDate: consecutiveCount >= threshold ? endDate : null,
  }
}

/**
 * Calculate attendance rate from records
 */
export function calculateAttendanceRate(records: { status: string }[]): number {
  if (records.length === 0) return 100

  const attended = records.filter(
    (r) => r.status === 'present' || r.status === 'late' || r.status === 'excused'
  ).length

  return Math.round((attended / records.length) * 100)
}

/**
 * Check if attendance rate is below threshold
 */
export function isLowAttendance(rate: number, threshold: number = 80): boolean {
  return rate < threshold
}

/**
 * Generate alert message based on type
 */
export function generateAlertMessage(
  type: AttendanceAlert['type'],
  studentName: string,
  details: {
    consecutiveDays?: number
    attendanceRate?: number
    threshold?: number
    subjectName?: string
  }
): string {
  switch (type) {
    case 'consecutive_absence':
      return `${studentName} has been absent for ${details.consecutiveDays} consecutive days${details.subjectName ? ` in ${details.subjectName}` : ''}. Immediate attention required.`

    case 'low_attendance':
      return `${studentName}'s attendance rate is ${details.attendanceRate}%${details.subjectName ? ` in ${details.subjectName}` : ''}, below the ${details.threshold}% threshold.`

    case 'pattern_warning':
      return `${studentName} shows irregular attendance patterns. Review recommended.`

    default:
      return `Attendance alert for ${studentName}`
  }
}

export default smartTriggersService
