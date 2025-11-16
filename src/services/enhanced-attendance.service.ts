/**
 * Enhanced Attendance Service
 *
 * Provides comprehensive attendance management features including:
 * - Bulk attendance marking
 * - Attendance summaries and analytics
 * - Excel import/export
 * - Time-based filtering (arrival/departure)
 * - Student and subject-level reporting
 *
 * Integration Points:
 * - Uses existing api.ts client for HTTP requests
 * - Compatible with existing record.service.ts
 * - Extends attendance.service.ts with advanced features
 */

import api from './api'
import {
  AttendanceRecord,
  AttendanceFormData,
  BulkAttendanceData,
  AttendanceSummary,
  StudentAttendanceSummary,
  SubjectAttendanceSummary,
  AttendanceFilters,
  ImportResult,
  ApiResponse,
} from '@/types'

export const enhancedAttendanceService = {
  /**
   * Mark attendance for a single student
   * @param data - Attendance form data
   * @returns Created attendance record
   */
  async markAttendance(data: AttendanceFormData): Promise<AttendanceRecord> {
    // Normalize field names coming from UI and ensure date is ISO string
    const studentId = (data as any).studentId || (data as any).student || (data as any).student_id
    const subjectId = (data as any).subjectId || (data as any).subject || (data as any).subject_id

    // Ensure date is an ISO string (fallback to now)
    let dateIso: string
    if ((data as any).date) {
      const parsed = new Date((data as any).date)
      dateIso = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
    } else {
      dateIso = new Date().toISOString()
    }

    const body: any = {
      studentId,
      date: dateIso,
      status: (data as any).status,
      remarks: (data as any).remarks ?? (data as any).notes ?? '',
    }

    if (typeof subjectId !== 'undefined' && subjectId !== null && subjectId !== '') {
      body.subjectId = String(subjectId)
    }

    const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/mark', body)
    return response.data.data
  },

  /**
   * Mark attendance for multiple students at once
   * @param data - Bulk attendance data
   * @returns Array of created attendance records
   */
  async markBulkAttendance(data: BulkAttendanceData): Promise<AttendanceRecord[]> {
    const response = await api.post<ApiResponse<AttendanceRecord[]>>('/attendance/bulk-mark', data)
    return response.data.data
  },

  /**
   * Get attendance records with advanced filtering
   * @param filters - Filter options (status, timeSlot, dateRange, etc.)
   * @returns Filtered attendance records
   */
  async getAttendanceRecords(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
    const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/records', {
      params: filters,
    })
    return response.data.data
  },

  /**
   * Get daily attendance summary
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   * @returns Attendance summary for the specified date
   */
  async getDailySummary(date?: string): Promise<AttendanceSummary> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const response = await api.get<ApiResponse<AttendanceSummary>>(
      `/attendance/summary/daily/${targetDate}`
    )
    return response.data.data
  },

  /**
   * Get attendance summary for a date range
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of daily summaries
   */
  async getDateRangeSummary(startDate: string, endDate: string): Promise<AttendanceSummary[]> {
    const response = await api.get<ApiResponse<AttendanceSummary[]>>('/attendance/summary/range', {
      params: { startDate, endDate },
    })
    return response.data.data
  },

  /**
   * Get attendance summary for a specific student
   * @param studentId - Student ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Student attendance summary
   */
  async getStudentSummary(
    studentId: number,
    startDate?: string,
    endDate?: string
  ): Promise<StudentAttendanceSummary> {
    const response = await api.get<ApiResponse<StudentAttendanceSummary>>(
      `/attendance/summary/student/${studentId}`,
      {
        params: { startDate, endDate },
      }
    )
    return response.data.data
  },

  /**
   * Get attendance summary for a specific subject
   * @param subjectId - Subject ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Subject attendance summary
   */
  async getSubjectSummary(
    subjectId: number,
    startDate?: string,
    endDate?: string
  ): Promise<SubjectAttendanceSummary> {
    const response = await api.get<ApiResponse<SubjectAttendanceSummary>>(
      `/attendance/summary/subject/${subjectId}`,
      {
        params: { startDate, endDate },
      }
    )
    return response.data.data
  },

  /**
   * Get all students' attendance summary
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of student attendance summaries
   */
  async getAllStudentsSummary(
    startDate?: string,
    endDate?: string
  ): Promise<StudentAttendanceSummary[]> {
    const response = await api.get<ApiResponse<StudentAttendanceSummary[]>>(
      '/attendance/summary/students',
      {
        params: { startDate, endDate },
      }
    )
    return response.data.data
  },

  /**
   * Import attendance records from Excel file
   * @param file - Excel file with attendance data
   * @returns Import result with success/failure details
   */
  async importFromExcel(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<ImportResult>>(
      '/attendance/import/excel',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data
  },

  /**
   * Export attendance records to Excel
   * @param filters - Optional filters for export
   * @returns Blob containing Excel file
   */
  async exportToExcel(filters?: AttendanceFilters): Promise<Blob> {
    const response = await api.get('/attendance/export/excel', {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Get today's arrival records
   * @returns Array of arrival records for today
   */
  async getTodayArrivals(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getAttendanceRecords({
      timeSlot: 'arrival',
      dateRange: { startDate: today, endDate: today },
    })
  },

  /**
   * Get today's departure records
   * @returns Array of departure records for today
   */
  async getTodayDepartures(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getAttendanceRecords({
      timeSlot: 'departure',
      dateRange: { startDate: today, endDate: today },
    })
  },

  /**
   * Check if student has checked in today
   * @param studentId - Student ID
   * @returns True if student has arrival record for today
   */
  async hasCheckedInToday(studentId: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const records = await this.getAttendanceRecords({
      studentId,
      timeSlot: 'arrival',
      dateRange: { startDate: today, endDate: today },
    })
    return records.length > 0
  },

  /**
   * Check if student has checked out today
   * @param studentId - Student ID
   * @returns True if student has departure record for today
   */
  async hasCheckedOutToday(studentId: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const records = await this.getAttendanceRecords({
      studentId,
      timeSlot: 'departure',
      dateRange: { startDate: today, endDate: today },
    })
    return records.length > 0
  },
}
