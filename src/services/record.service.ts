import apiClient from './api'
import { Record, DashboardStats, AttendanceRecord } from '@/types'

export const recordService = {
  async getAll(): Promise<Record[]> {
    const response = await apiClient.get<Record[]>('/records')
    return response.data
  },

  async getToday(): Promise<Record[]> {
    const response = await apiClient.get<Record[]>('/records/today')
    return response.data
  },

  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/records/stats')
    return response.data
  },

  async getById(id: number): Promise<Record> {
    const response = await apiClient.get<Record>(`/records/${id}`)
    return response.data
  },

  async getByStudent(studentId: number): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/student/${studentId}`)
    return response.data
  },

  async getBySubject(subjectId: string | number): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/subject/${subjectId}`)
    return response.data
  },

  async getByType(type: string): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/type/${type}`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/records/${id}`)
  },

  /**
   * Get all attendance records including subject-specific attendance
   */
  async getAllAttendanceRecords(filters?: {
    startDate?: string
    endDate?: string
    studentId?: number
    subjectId?: string | number
    status?: string
  }): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.studentId) params.append('studentId', filters.studentId.toString())
    if (filters?.subjectId) params.append('subjectId', filters.subjectId.toString())
    if (filters?.status) params.append('status', filters.status)

    const response = await apiClient.get<any>(`/attendance/records?${params.toString()}`)
    // Handle both paginated and direct response formats
    return (
      response.data.data?.records || response.data.records || response.data.data || response.data
    )
  },
}
