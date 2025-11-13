import apiClient from './api'

interface Attendance {
  id: number
  studentId: number
  subjectId: number
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface AttendanceFormData {
  studentId: number
  subjectId: number
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

  async getById(id: number): Promise<Attendance> {
    const response = await apiClient.get<Attendance>(`/attendance/${id}`)
    return response.data
  },

  async getByStudent(studentId: number): Promise<Attendance[]> {
    const response = await apiClient.get<Attendance[]>(`/attendance/student/${studentId}`)
    return response.data
  },

  async getBySubject(subjectId: number): Promise<Attendance[]> {
    const response = await apiClient.get<Attendance[]>(`/attendance/subject/${subjectId}`)
    return response.data
  },

  async create(data: AttendanceFormData): Promise<Attendance> {
    const response = await apiClient.post<Attendance>('/attendance', data)
    return response.data
  },

  async update(id: number, data: Partial<AttendanceFormData>): Promise<Attendance> {
    const response = await apiClient.put<Attendance>(`/attendance/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/attendance/${id}`)
  },
}
