/**
 * Subject Attendance Service
 *
 * Handles attendance marking specific to subjects
 */

import apiClient from './api'
import {
  SubjectAttendanceData,
  BulkSubjectAttendanceData,
  SubjectAttendanceSummaryEnhanced,
  StudentSubjectAttendance,
} from '@/types/subject.types'
import { AttendanceRecord, ApiResponse } from '@/types'

export interface MarkAttendanceRequest {
  studentId: string
  subjectId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  timeSlot?: 'arrival' | 'departure'
  scheduleSlot?: string
  notes?: string
}

export const subjectAttendanceService = {
  /**
   * Mark attendance for a student in a subject
   */
  async markSubjectAttendance(data: SubjectAttendanceData): Promise<AttendanceRecord> {
    const response = await apiClient.post<ApiResponse<AttendanceRecord>>(
      '/attendance/subject/mark',
      {
        subjectId: data.subjectId,
        studentId: data.studentId, // Backend expects 'studentId' not 'student'
        date: data.date,
        status: data.status,
        timeSlot: data.timeSlot,
        scheduleSlot: data.scheduleSlot,
        // Backend expects 'remarks' field; the SubjectAttendanceData type uses 'notes' for clarity.
        // Map notes to remarks to ensure the backend receives the field it expects.
        remarks: (data as any).remarks ?? data.notes,
      }
    )
    return response.data.data || response.data
  },

  /**
   * Bulk mark attendance for multiple students
   */
  async bulkMarkSubjectAttendance(data: BulkSubjectAttendanceData): Promise<AttendanceRecord[]> {
    // Normalize fields to ensure backend receives 'remarks' (legacy name) when 'notes' is used
    const payload: any = { ...data, remarks: (data as any).remarks ?? (data as any).notes }
    const response = await apiClient.post<ApiResponse<AttendanceRecord[]>>(
      '/attendance/subject/bulk-mark',
      payload
    )
    // Ensure we always return an array
    const result = response.data?.data ?? response.data
    return Array.isArray(result) ? result : []
  },

  /**
   * Get attendance records for a subject on a specific date
   */
  async getSubjectAttendanceByDate(
    subjectId: string | number,
    date: string
  ): Promise<AttendanceRecord[]> {
    const response = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
      `/attendance/subject/${subjectId}/date/${date}`
    )
    // Ensure we always return an array, handling various API response formats
    const data = response.data?.data ?? response.data
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object' && 'records' in data && Array.isArray(data.records)) {
      return data.records
    }
    if (
      data &&
      typeof data === 'object' &&
      'attendance' in data &&
      Array.isArray(data.attendance)
    ) {
      return data.attendance
    }
    return []
  },

  /**
   * Get attendance summary for a subject on a specific date
   */
  async getSubjectAttendanceSummary(
    subjectId: string | number,
    date: string
  ): Promise<SubjectAttendanceSummaryEnhanced> {
    const response = await apiClient.get<ApiResponse<SubjectAttendanceSummaryEnhanced>>(
      `/attendance/subject/${subjectId}/summary/${date}`
    )
    return response.data.data || response.data
  },

  /**
   * Get a student's attendance history for a specific subject
   */
  async getStudentSubjectAttendance(
    studentId: number,
    subjectId: string | number
  ): Promise<StudentSubjectAttendance> {
    const response = await apiClient.get<ApiResponse<StudentSubjectAttendance>>(
      `/attendance/subject/${subjectId}/student/${studentId}`
    )
    return response.data.data || response.data
  },

  /**
   * Mark all students as present
   */
  async markAllPresent(
    subjectId: string | number,
    date: string,
    studentIds: number[]
  ): Promise<AttendanceRecord[]> {
    return this.bulkMarkSubjectAttendance({
      subjectId,
      studentIds,
      date,
      status: 'present',
      timeSlot: 'arrival',
    })
  },

  /**
   * Mark all students as absent
   */
  async markAllAbsent(
    subjectId: string | number,
    date: string,
    studentIds: number[]
  ): Promise<AttendanceRecord[]> {
    return this.bulkMarkSubjectAttendance({
      subjectId,
      studentIds,
      date,
      status: 'absent',
    })
  },

  /**
   * Mark all students as late
   */
  async markAllLate(
    subjectId: string | number,
    date: string,
    studentIds: number[]
  ): Promise<AttendanceRecord[]> {
    return this.bulkMarkSubjectAttendance({
      subjectId,
      studentIds,
      date,
      status: 'late',
      timeSlot: 'arrival',
    })
  },

  /**
   * Mark all students as excused
   */
  async markAllExcused(
    subjectId: string | number,
    date: string,
    studentIds: number[]
  ): Promise<AttendanceRecord[]> {
    return this.bulkMarkSubjectAttendance({
      subjectId,
      studentIds,
      date,
      status: 'excused',
    })
  },
}
